const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const MAX_OTP_ATTEMPTS = 5;

const encoder = new TextEncoder();

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function allowedEmail(env, email) {
  const allowed = String(env.ALLOWED_EMAILS || '')
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
  return allowed.length === 0 || allowed.includes(normalizeEmail(email));
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function randomCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1000000).padStart(6, '0');
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function hashOtp(email, code, env) {
  return base64Url(await hmac(`${email}:${code}`, env.TOKEN_SECRET));
}

async function issueToken(email, env) {
  const payload = base64Url(
    encoder.encode(
      JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
    ),
  );
  const signature = base64Url(await hmac(payload, env.TOKEN_SECRET));
  return `${payload}.${signature}`;
}

async function verifyToken(token, env) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = base64Url(await hmac(payload, env.TOKEN_SECRET));
  if (signature !== expected) return null;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (!validEmail(decoded.email) || !allowedEmail(env, decoded.email) || Number(decoded.exp) <= Date.now() / 1000) return null;
    return decoded;
  } catch {
    return null;
  }
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function consumeRate(env, key, limit, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare(
    'SELECT window_start, count FROM rate_limits WHERE rate_key = ?',
  )
    .bind(key)
    .first();

  if (!row || now - Number(row.window_start) >= windowMs) {
    await env.DB.prepare(
      `INSERT INTO rate_limits (rate_key, window_start, count)
       VALUES (?, ?, 1)
       ON CONFLICT(rate_key) DO UPDATE SET window_start = excluded.window_start, count = 1`,
    )
      .bind(key, now)
      .run();
    return true;
  }

  if (Number(row.count) >= limit) return false;
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE rate_key = ?')
    .bind(key)
    .run();
  return true;
}

async function sendOtpEmail(env, email, code) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ScopeCut/1.0',
    },
    body: JSON.stringify({
      from: env.AUTH_FROM || 'ScopeCut <login@auth.kainnne.com>',
      reply_to: env.AUTH_REPLY_TO || 'ryanzhu@kainnne.com',
      to: [email],
      subject: `ScopeCut 驗證碼：${code}`,
      text: `你的 ScopeCut 驗證碼是：${code}\n\n10 分鐘內有效。若不是你本人操作，請忽略此信。`,
      html: `<p>你的 ScopeCut 驗證碼是：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>10 分鐘內有效。若不是你本人操作，請忽略此信。</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend delivery failed: ${response.status}`);
}

async function requestOtp(request, env) {
  const body = await parseJson(request);
  const email = normalizeEmail(body.email);
  if (!validEmail(email)) return json({ error: '請輸入有效的 Email' }, 400);
  if (!allowedEmail(env, email)) return json({ error: '目前僅開放指定測試帳號' }, 403);

  const ip = clientIp(request);
  const [ipAllowed, emailAllowed, globalAllowed] = await Promise.all([
    consumeRate(env, `otp-ip:${ip}`, 5, 60 * 60 * 1000),
    consumeRate(env, `otp-email:${email}`, 3, 60 * 60 * 1000),
    consumeRate(env, 'otp-global', 100, 24 * 60 * 60 * 1000),
  ]);
  if (!ipAllowed || !emailAllowed || !globalAllowed) {
    return json({ error: '寄送次數過多，請稍後再試' }, 429);
  }

  const existing = await env.DB.prepare('SELECT sent_at FROM otp_requests WHERE email = ?')
    .bind(email)
    .first();
  if (existing && Date.now() - Number(existing.sent_at) < 60 * 1000) {
    return json({ error: '請等待 1 分鐘後再重新寄送' }, 429);
  }

  const code = randomCode();
  const codeHash = await hashOtp(email, code, env);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO otp_requests (email, code_hash, expires_at, attempts, sent_at, ip)
     VALUES (?, ?, ?, 0, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       code_hash = excluded.code_hash,
       expires_at = excluded.expires_at,
       attempts = 0,
       sent_at = excluded.sent_at,
       ip = excluded.ip`,
  )
    .bind(email, codeHash, now + OTP_TTL_MS, now, ip)
    .run();

  try {
    await sendOtpEmail(env, email, code);
  } catch (error) {
    await env.DB.prepare('DELETE FROM otp_requests WHERE email = ?').bind(email).run();
    console.error('ScopeCut email delivery failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: '驗證信暫時無法寄出，請稍後再試' }, 502);
  }

  return json({ ok: true, expiresIn: OTP_TTL_MS / 1000 });
}

function dailyKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function pointsRemaining(env, email) {
  const limit = Math.max(1, Number(env.DAILY_POINTS || 2));
  const row = await env.DB.prepare('SELECT used FROM daily_usage WHERE email = ? AND day = ?')
    .bind(email, dailyKey())
    .first();
  return Math.max(0, limit - Number(row?.used || 0));
}

async function verifyOtpCode(request, env) {
  const body = await parseJson(request);
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').trim();
  if (!validEmail(email) || !/^\d{6}$/.test(code)) {
    return json({ error: '請輸入六位數驗證碼' }, 400);
  }
  if (!allowedEmail(env, email)) return json({ error: '目前僅開放指定測試帳號' }, 403);

  const pending = await env.DB.prepare(
    'SELECT code_hash, expires_at, attempts FROM otp_requests WHERE email = ?',
  )
    .bind(email)
    .first();
  if (!pending || Number(pending.expires_at) < Date.now()) {
    await env.DB.prepare('DELETE FROM otp_requests WHERE email = ?').bind(email).run();
    return json({ error: '驗證碼已過期，請重新寄送' }, 400);
  }
  if (Number(pending.attempts) >= MAX_OTP_ATTEMPTS) {
    return json({ error: '嘗試次數過多，請重新寄送' }, 429);
  }

  const codeHash = await hashOtp(email, code, env);
  if (codeHash !== pending.code_hash) {
    await env.DB.prepare('UPDATE otp_requests SET attempts = attempts + 1 WHERE email = ?')
      .bind(email)
      .run();
    return json({ error: '驗證碼錯誤' }, 400);
  }

  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM otp_requests WHERE email = ?').bind(email),
    env.DB.prepare(
      `INSERT INTO users (email, created_at, last_login_at)
       VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET last_login_at = excluded.last_login_at`,
    ).bind(email, now, now),
  ]);

  return json({
    ok: true,
    token: await issueToken(email, env),
    points: await pointsRemaining(env, email),
  });
}

async function authenticatedEmail(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return (await verifyToken(token, env))?.email || null;
}

async function consumePoint(request, env) {
  const email = await authenticatedEmail(request, env);
  if (!email) return json({ error: '請重新驗證 Email' }, 401);
  const limit = Math.max(1, Number(env.DAILY_POINTS || 2));
  const result = await env.DB.prepare(
    `INSERT INTO daily_usage (email, day, used)
     VALUES (?, ?, 1)
     ON CONFLICT(email, day) DO UPDATE SET used = daily_usage.used + 1
     WHERE daily_usage.used < ?
     RETURNING used`,
  )
    .bind(email, dailyKey(), limit)
    .first();
  if (!result) return json({ error: '今天的免費點數已使用完畢', points: 0 }, 429);
  return json({ ok: true, points: Math.max(0, limit - Number(result.used)) });
}

async function handle(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method === 'GET' && url.pathname === '/health') {
    return json({ ok: true, service: 'scopecut-auth' });
  }
  if (request.method === 'POST' && url.pathname === '/api/auth/send-code') {
    return requestOtp(request, env);
  }
  if (request.method === 'POST' && url.pathname === '/api/auth/verify') {
    return verifyOtpCode(request, env);
  }
  if (request.method === 'POST' && url.pathname === '/api/usage/consume') {
    return consumePoint(request, env);
  }
  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    const origin = request.headers.get('Origin');
    if (origin && !headers['Access-Control-Allow-Origin']) {
      return json({ error: 'Origin not allowed' }, 403);
    }
    try {
      const response = await handle(request, env);
      const output = new Response(response.body, response);
      for (const [key, value] of Object.entries(headers)) output.headers.set(key, value);
      output.headers.set('Cache-Control', 'no-store');
      output.headers.set('X-Content-Type-Options', 'nosniff');
      return output;
    } catch (error) {
      console.error('ScopeCut worker error', error instanceof Error ? error.message : 'unknown');
      return json({ error: '服務暫時無法使用' }, 500, headers);
    }
  },
};

const OTP_TTL_MS = 10 * 60 * 1000;
const ADMIN_TTL_SECONDS = 24 * 60 * 60;
const ANON_TTL_SECONDS = 365 * 24 * 60 * 60;
const MAX_OTP_ATTEMPTS = 5;
const MAX_BRIEF_CHARACTERS = 30000;
const MAX_FILES = 5;
const MAX_TOTAL_FILE_BYTES = 50 * 1024 * 1024;
const LONG_CONTEXT_THRESHOLD = 272000;
const MODEL_MAX_OUTPUT_TOKENS = 128000;
const FILE_SEARCH_CALL_MICROUSD = 2500;
const QUOTE_TTL_MS = 30 * 60 * 1000;
const JOB_TIMEOUT_MS = 5 * 60 * 1000;

const ACCEPTED_EXTENSIONS = new Set([
  'pdf', 'txt', 'md', 'json', 'html', 'xml', 'csv', 'doc', 'docx', 'rtf', 'odt',
  'ppt', 'pptx', 'xls', 'xlsx', 'tsv',
]);

const MODEL_PRICES = {
  'gpt-5.6-luna': { input: 0.2, cached: 0.02, output: 1.2 },
  'gpt-5.6-terra': { input: 2, cached: 0.2, output: 12 },
  'gpt-5.6-sol': { input: 4, cached: 0.4, output: 20 },
};

const PROJECT_INSTRUCTIONS = [
  '你是 ScopeCut 的 Project 規劃助手。使用者聰明、有想法與熱誠，但不熟悉如何把需求交給 AI Agent。',
  '請把 Project Brief 與附件發展成一個清楚、可執行且不過度複雜的第一版，不要把選擇重新丟回給使用者。',
  '輸出只有兩個部分：plan 是寫給使用者看的企劃說明；agent_prompt 是可直接貼給另一個 AI Agent 的正式工作內容，並依固定段落分類。',
  'plan 要明確說明這次要做什麼、第一版大致長什麼樣、核心功能、適合的工具與技術、完成時值得理解的知識，以及各項規劃理由。',
  'plan 使用專業但容易理解的文字。每一項都必須針對這個 Project，避免空泛建議、重複內容、把初學者當成不懂思考的人，或同時提供多個相似方案。',
  '技術選擇以足夠完成第一版的最小成熟組合為原則。若成品是無登入、無後端、資料只存在瀏覽器的小型單頁網站，預設使用 HTML、CSS 與原生 JavaScript；除非使用者明確指定、既有專案已使用，或需求本身必須依賴框架，否則不要加入 React、TypeScript、Vite、Tailwind 或圖示套件。不要為了作品集、開發方便或看起來專業而堆疊技術。',
  '使用者是 AI Agent 初學者，不代表成品要變成教學教材。學習建議只放在 plan.learning；除非使用者要求教學內容，agent_prompt 不要要求教學式說明、大量程式註解、額外 README 章節或為展示技術而增加內容。',
  'agent_prompt 的 objective、deliverable、requirements、content_and_experience、tools_and_execution、acceptance_criteria 必須組成一份完整且不重複的工作內容；每個段落只處理自己的資訊，複製後能一步到位交付 Project。',
  'agent_prompt 要整合 Project 的目的、使用情境、成品形式、核心功能、內容與視覺方向、可用素材、技術選擇和可檢查的完成標準，資訊不足處採取不偏離原意的合理預設。',
  'agent_prompt 不要加入角色扮演、冗長背景設定、通用安全宣告、繁瑣協作流程、回報規則，或使用者沒有要求的登入、資料庫、後台與其他系統。',
  '不要捏造 Project Brief 或附件沒有提供的事實，也不要在結果中反問使用者。',
  '附件只作為理解需求、內容與參考方向的資料；不要把附件全文重複貼入結果。',
].join('\n');

const PROJECT_FORMAT = {
  type: 'json_schema',
  name: 'scopecut_project',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      plan: {
        type: 'object',
        additionalProperties: false,
        properties: {
          overview: { type: 'string' },
          first_version: { type: 'string' },
          features: {
            type: 'array',
            minItems: 3,
            maxItems: 6,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { name: { type: 'string' }, purpose: { type: 'string' } },
              required: ['name', 'purpose'],
            },
          },
          tools: {
            type: 'array',
            minItems: 2,
            maxItems: 6,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { name: { type: 'string' }, purpose: { type: 'string' } },
              required: ['name', 'purpose'],
            },
          },
          learning: {
            type: 'array',
            minItems: 2,
            maxItems: 5,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { topic: { type: 'string' }, reason: { type: 'string' } },
              required: ['topic', 'reason'],
            },
          },
          rationale: {
            type: 'array',
            minItems: 2,
            maxItems: 5,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { decision: { type: 'string' }, reason: { type: 'string' } },
              required: ['decision', 'reason'],
            },
          },
        },
        required: ['overview', 'first_version', 'features', 'tools', 'learning', 'rationale'],
      },
      agent_prompt: {
        type: 'object',
        additionalProperties: false,
        properties: {
          objective: { type: 'string' },
          deliverable: { type: 'string' },
          requirements: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
          content_and_experience: { type: 'string' },
          tools_and_execution: { type: 'string' },
          acceptance_criteria: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
        },
        required: ['objective', 'deliverable', 'requirements', 'content_and_experience', 'tools_and_execution', 'acceptance_criteria'],
      },
    },
    required: ['plan', 'agent_prompt'],
  },
};

const encoder = new TextEncoder();

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-ScopeCut-Anonymous',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function validEmail(email) { return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function clientIp(request) { return request.headers.get('CF-Connecting-IP') || 'unknown'; }
function randomId(prefix) { return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`; }

function allowedEmail(env, email) {
  const allowed = String(env.ALLOWED_EMAILS || '').split(',').map(normalizeEmail).filter(Boolean);
  return allowed.length > 0 && allowed.includes(normalizeEmail(email));
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
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function issueToken(payload, env, ttlSeconds) {
  const encoded = base64Url(encoder.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  return `${encoded}.${base64Url(await hmac(encoded, env.TOKEN_SECRET))}`;
}

async function verifyToken(token, env, type) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature || base64Url(await hmac(payload, env.TOKEN_SECRET)) !== signature) return null;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    return decoded.type === type && Number(decoded.exp) > Date.now() / 1000 ? decoded : null;
  } catch { return null; }
}

async function sha256(value) {
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', value)));
}

async function parseJson(request) {
  try { return await request.json(); } catch { return {}; }
}

function dailyKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function numberEnv(env, key, fallback, minimum = 0) {
  const value = Number(env[key]);
  return Number.isFinite(value) ? Math.max(minimum, value) : fallback;
}

function modelPrice(model) { return MODEL_PRICES[model] || MODEL_PRICES['gpt-5.6-luna']; }

export function calculateCostMicrousd({ model = 'gpt-5.6-luna', inputTokens = 0, cachedTokens = 0, outputTokens = 0, fileSearchCalls = 0 }) {
  const price = modelPrice(model);
  const input = Math.max(0, Number(inputTokens) || 0);
  const cached = Math.min(input, Math.max(0, Number(cachedTokens) || 0));
  const output = Math.max(0, Number(outputTokens) || 0);
  const longContext = input > LONG_CONTEXT_THRESHOLD;
  const tokenCost = ((input - cached) * price.input + cached * price.cached) * (longContext ? 2 : 1)
    + output * price.output * (longContext ? 1.5 : 1);
  return Math.ceil(tokenCost + Math.max(0, Number(fileSearchCalls) || 0) * FILE_SEARCH_CALL_MICROUSD);
}

export function pointsForCost(costMicrousd, pointMicrousd = 30000) {
  return Math.max(1, Math.ceil(Math.max(0, Number(costMicrousd) || 0) / Math.max(1, pointMicrousd)));
}

export function costBand(costMicrousd) {
  const cost = Math.max(0, Number(costMicrousd) || 0);
  if (cost <= 30000) return 'normal';
  if (cost <= 90000) return 'elevated';
  if (cost <= 300000) return 'heavy';
  return 'extreme';
}

function inputSizeLabel(tokens) {
  if (tokens <= 100000) return 'standard';
  if (tokens <= LONG_CONTEXT_THRESHOLD) return 'large';
  return 'extreme';
}

async function consumeRate(env, key, limit, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT window_start, count FROM rate_limits WHERE rate_key = ?').bind(key).first();
  if (!row || now - Number(row.window_start) >= windowMs) {
    await env.DB.prepare(
      `INSERT INTO rate_limits (rate_key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(rate_key) DO UPDATE SET window_start = excluded.window_start, count = 1`,
    ).bind(key, now).run();
    return true;
  }
  if (Number(row.count) >= limit) return false;
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE rate_key = ?').bind(key).run();
  return true;
}

async function openAIRequest(env, path, options = {}) {
  const response = await fetch(`https://api.openai.com/v1${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'User-Agent': 'ScopeCut/1.0', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error?.message || `OpenAI request failed: ${response.status}`);
    error.status = response.status;
    error.requestId = response.headers.get('x-request-id') || '';
    throw error;
  }
  return body;
}

async function sendOtpEmail(env, email, code) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'User-Agent': 'ScopeCut/1.0' },
    body: JSON.stringify({
      from: env.AUTH_FROM || 'ScopeCut <login@auth.kainnne.com>',
      reply_to: env.AUTH_REPLY_TO || 'ryanzhu@kainnne.com',
      to: [email],
      subject: `ScopeCut 管理驗證碼：${code}`,
      text: `你的 ScopeCut 管理驗證碼是：${code}\n\n10 分鐘內有效。`,
      html: `<p>你的 ScopeCut 管理驗證碼是：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>10 分鐘內有效。</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend delivery failed: ${response.status}`);
}

async function requestOtp(request, env) {
  const { email: rawEmail } = await parseJson(request);
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return json({ error: '請輸入有效的 Email' }, 400);
  if (!allowedEmail(env, email)) return json({ error: '此帳號沒有管理權限' }, 403);
  const [ipAllowed, emailAllowed] = await Promise.all([
    consumeRate(env, `otp-ip:${clientIp(request)}`, 5, 60 * 60 * 1000),
    consumeRate(env, `otp-email:${email}`, 3, 60 * 60 * 1000),
  ]);
  if (!ipAllowed || !emailAllowed) return json({ error: '寄送次數過多，請稍後再試' }, 429);

  const existing = await env.DB.prepare('SELECT sent_at FROM otp_requests WHERE email = ?').bind(email).first();
  if (existing && Date.now() - Number(existing.sent_at) < 60000) return json({ error: '請等待 1 分鐘後再重新寄送' }, 429);

  const code = randomCode();
  const now = Date.now();
  const codeHash = base64Url(await hmac(`${email}:${code}`, env.TOKEN_SECRET));
  await env.DB.prepare(
    `INSERT INTO otp_requests (email, code_hash, expires_at, attempts, sent_at, ip) VALUES (?, ?, ?, 0, ?, ?)
     ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
       attempts = 0, sent_at = excluded.sent_at, ip = excluded.ip`,
  ).bind(email, codeHash, now + OTP_TTL_MS, now, clientIp(request)).run();
  try { await sendOtpEmail(env, email, code); }
  catch (error) {
    await env.DB.prepare('DELETE FROM otp_requests WHERE email = ?').bind(email).run();
    console.error('ScopeCut email failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: '驗證信暫時無法寄出' }, 502);
  }
  return json({ ok: true, expiresIn: OTP_TTL_MS / 1000 });
}

async function verifyOtpCode(request, env) {
  const body = await parseJson(request);
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').trim();
  if (!validEmail(email) || !/^\d{6}$/.test(code)) return json({ error: '請輸入六位數驗證碼' }, 400);
  if (!allowedEmail(env, email)) return json({ error: '此帳號沒有管理權限' }, 403);
  const pending = await env.DB.prepare('SELECT code_hash, expires_at, attempts FROM otp_requests WHERE email = ?').bind(email).first();
  if (!pending || Number(pending.expires_at) < Date.now()) return json({ error: '驗證碼已過期' }, 400);
  if (Number(pending.attempts) >= MAX_OTP_ATTEMPTS) return json({ error: '嘗試次數過多' }, 429);
  const codeHash = base64Url(await hmac(`${email}:${code}`, env.TOKEN_SECRET));
  if (codeHash !== pending.code_hash) {
    await env.DB.prepare('UPDATE otp_requests SET attempts = attempts + 1 WHERE email = ?').bind(email).run();
    return json({ error: '驗證碼錯誤' }, 400);
  }
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM otp_requests WHERE email = ?').bind(email),
    env.DB.prepare(
      `INSERT INTO users (email, created_at, last_login_at) VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET last_login_at = excluded.last_login_at`,
    ).bind(email, now, now),
  ]);
  return json({ ok: true, token: await issueToken({ type: 'admin', email }, env, ADMIN_TTL_SECONDS) });
}

async function adminIdentity(request, env) {
  const header = request.headers.get('Authorization') || '';
  const identity = await verifyToken(header.startsWith('Bearer ') ? header.slice(7) : '', env, 'admin');
  return identity && allowedEmail(env, identity.email) ? identity : null;
}

async function createAnonymousSession(env) {
  const anonId = randomId('anon');
  const now = Date.now();
  await env.DB.prepare('INSERT INTO anonymous_users (anon_id, created_at, last_seen_at) VALUES (?, ?, ?)').bind(anonId, now, now).run();
  return json({ ok: true, token: await issueToken({ type: 'anon', anonId }, env, ANON_TTL_SECONDS) });
}

async function anonymousIdentity(request, env) {
  const identity = await verifyToken(request.headers.get('X-ScopeCut-Anonymous') || '', env, 'anon');
  if (!identity?.anonId) return null;
  await env.DB.prepare('UPDATE anonymous_users SET last_seen_at = ? WHERE anon_id = ?').bind(Date.now(), identity.anonId).run();
  return identity;
}

function extensionOf(filename) {
  const parts = String(filename || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

async function uploadOpenAIFile(env, file) {
  const form = new FormData();
  form.append('purpose', 'user_data');
  form.append('expires_after[anchor]', 'created_at');
  form.append('expires_after[seconds]', String(numberEnv(env, 'FILE_TTL_SECONDS', 86400, 3600)));
  form.append('file', file, file.name);
  return openAIRequest(env, '/files', { method: 'POST', body: form });
}

async function deleteOpenAIResources(env, event) {
  const files = JSON.parse(event.file_ids_json || '[]');
  const tasks = files.map((file) => openAIRequest(env, `/files/${encodeURIComponent(file.id || file)}`, { method: 'DELETE' }).catch(() => null));
  if (event.vector_store_id) tasks.push(openAIRequest(env, `/vector_stores/${encodeURIComponent(event.vector_store_id)}`, { method: 'DELETE' }).catch(() => null));
  if (event.response_id) tasks.push(openAIRequest(env, `/responses/${encodeURIComponent(event.response_id)}`, { method: 'DELETE' }).catch(() => null));
  await Promise.all(tasks);
}

async function cleanupExpiredQuotes(env) {
  const expired = await env.DB.prepare(
    "SELECT * FROM usage_events WHERE status = 'quoted' AND created_at < ? ORDER BY created_at LIMIT 20",
  ).bind(Date.now() - QUOTE_TTL_MS).all();
  for (const event of expired.results || []) {
    const claimed = await env.DB.prepare(
      "UPDATE usage_events SET status = 'expired', completed_at = ?, error_code = 'quote_expired' WHERE request_id = ? AND status = 'quoted' RETURNING request_id",
    ).bind(Date.now(), event.request_id).first();
    if (claimed) await deleteOpenAIResources(env, event);
  }
}

function directInput(brief, files, visualDetail) {
  return [{ role: 'user', content: [
    { type: 'input_text', text: brief },
    ...files.map((file) => ({
      type: 'input_file', file_id: file.id,
      ...(file.extension === 'pdf' ? { detail: visualDetail ? 'high' : 'low' } : {}),
    })),
  ] }];
}

async function countInputTokens(env, model, input) {
  const counted = await openAIRequest(env, '/responses/input_tokens', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, instructions: PROJECT_INSTRUCTIONS, input }),
  });
  return Math.max(0, Number(counted.input_tokens || 0));
}

async function quoteProject(request, env) {
  const identity = await anonymousIdentity(request, env);
  if (!identity) return json({ error: '匿名測試工作階段已失效，請重新整理' }, 401);
  if (!env.OPENAI_API_KEY) return json({ error: 'AI 服務尚未完成設定' }, 503);
  await cleanupExpiredQuotes(env);
  const checks = await Promise.all([
    consumeRate(env, `quote-anon:${identity.anonId}`, numberEnv(env, 'ANON_QUOTES_PER_HOUR', 12, 1), 3600000),
    consumeRate(env, `quote-ip:${clientIp(request)}`, numberEnv(env, 'IP_QUOTES_PER_HOUR', 30, 1), 3600000),
  ]);
  if (checks.includes(false)) return json({ error: '測試請求較多，請稍後再試' }, 429);

  const form = await request.formData();
  const brief = String(form.get('brief') || '').trim();
  const visualDetail = String(form.get('visualDetail') || '') === 'high';
  if (brief.length < 20) return json({ error: 'Project Brief 內容不足' }, 400);
  if (brief.length > MAX_BRIEF_CHARACTERS) return json({ error: 'Project Brief 內容過長' }, 413);
  const files = form.getAll('files').filter((file) => typeof file?.arrayBuffer === 'function' && file.size > 0);
  if (files.length > MAX_FILES) return json({ error: `一次最多上傳 ${MAX_FILES} 個附件` }, 413);
  const totalBytes = files.reduce((total, file) => total + Number(file.size || 0), 0);
  if (totalBytes > MAX_TOTAL_FILE_BYTES) return json({ error: '附件合計不可超過 50 MB' }, 413);
  for (const file of files) {
    if (!ACCEPTED_EXTENSIONS.has(extensionOf(file.name))) return json({ error: `不支援的附件格式：${file.name}` }, 415);
  }

  const uploaded = [];
  const metadata = [];
  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const result = await uploadOpenAIFile(env, file);
      uploaded.push({ id: result.id, extension: extensionOf(file.name) });
      metadata.push({ hash: await sha256(bytes), extension: extensionOf(file.name), mime: file.type || 'application/octet-stream', bytes: file.size });
    }
    const model = String(env.OPENAI_MODEL || 'gpt-5.6-luna');
    const inputTokens = await countInputTokens(env, model, directInput(brief, uploaded, visualDetail));
    const readingMode = inputTokens > LONG_CONTEXT_THRESHOLD ? 'file_search' : 'direct';
    const predictedInput = readingMode === 'file_search' ? Math.min(inputTokens, 100000) : inputTokens;
    const estimatedCost = calculateCostMicrousd({
      model, inputTokens: predictedInput,
      outputTokens: numberEnv(env, 'PREDICTED_OUTPUT_TOKENS', 8000, 1000),
      fileSearchCalls: readingMode === 'file_search' ? 1 : 0,
    });
    const pointCost = numberEnv(env, 'POINT_MICROUSD', 30000, 1);
    const requestId = randomId('req');
    await env.DB.prepare(
      `INSERT INTO usage_events (
        request_id, anon_id, day, created_at, status, model, reasoning_effort, reading_mode, visual_detail,
        file_ids_json, input_tokens_estimated, estimated_cost_microusd, estimated_points,
        file_count, total_file_bytes, cost_band
      ) VALUES (?, ?, ?, ?, 'quoted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      requestId, identity.anonId, dailyKey(), Date.now(), model,
      String(env.OPENAI_REASONING_EFFORT || 'low'), readingMode, visualDetail ? 'high' : 'low',
      JSON.stringify(uploaded), inputTokens, estimatedCost,
      pointsForCost(estimatedCost, pointCost), files.length, totalBytes, costBand(estimatedCost),
    ).run();
    if (metadata.length) {
      await env.DB.batch(metadata.map((file) => env.DB.prepare(
        'INSERT INTO usage_files (request_id, file_hash, extension, mime_type, bytes) VALUES (?, ?, ?, ?, ?)',
      ).bind(requestId, file.hash, file.extension, file.mime, file.bytes)));
    }
    return json({
      ok: true, quoteId: requestId,
      estimatedPoints: pointsForCost(estimatedCost, pointCost),
      inputSize: inputSizeLabel(inputTokens), readingMode, fileCount: files.length,
      expiresIn: QUOTE_TTL_MS / 1000,
    });
  } catch (error) {
    await Promise.all(uploaded.map((file) => openAIRequest(env, `/files/${file.id}`, { method: 'DELETE' }).catch(() => null)));
    console.error('ScopeCut quote failed', error instanceof Error ? error.message : 'unknown', error?.requestId || '');
    return json({ error: '暫時無法讀取附件與估算點數' }, 502);
  }
}

async function createVectorStore(env, requestId, fileIds) {
  const store = await openAIRequest(env, '/vector_stores', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `ScopeCut ${requestId}`, expires_after: { anchor: 'last_active_at', days: 1 } }),
  });
  const batch = await openAIRequest(env, `/vector_stores/${store.id}/file_batches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_ids: fileIds }),
  });
  const deadline = Date.now() + 60000;
  let current = batch;
  while (!['completed', 'failed', 'cancelled'].includes(current.status) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    current = await openAIRequest(env, `/vector_stores/${store.id}/file_batches/${batch.id}`);
  }
  if (current.status !== 'completed') {
    await openAIRequest(env, `/vector_stores/${store.id}`, { method: 'DELETE' }).catch(() => null);
    throw new Error('File Search indexing failed');
  }
  return store.id;
}

async function reserveBudget(env, reserveMicrousd) {
  const budget = numberEnv(env, 'DAILY_BUDGET_MICROUSD', 3000000, 1);
  if (reserveMicrousd > budget) return null;
  return env.DB.prepare(
    `INSERT INTO daily_system_usage (day, request_count, reserved_cost_microusd) VALUES (?, 1, ?)
     ON CONFLICT(day) DO UPDATE SET request_count = daily_system_usage.request_count + 1,
       reserved_cost_microusd = daily_system_usage.reserved_cost_microusd + excluded.reserved_cost_microusd
     WHERE daily_system_usage.actual_cost_microusd + daily_system_usage.reserved_cost_microusd
       + excluded.reserved_cost_microusd <= ?
     RETURNING actual_cost_microusd, reserved_cost_microusd`,
  ).bind(dailyKey(), reserveMicrousd, budget).first();
}

async function startGeneration(request, env) {
  const identity = await anonymousIdentity(request, env);
  if (!identity) return json({ error: '匿名測試工作階段已失效，請重新整理' }, 401);
  const body = await parseJson(request);
  const requestId = String(body.quoteId || '');
  const brief = String(body.brief || '').trim();
  if (!requestId || brief.length < 20 || brief.length > MAX_BRIEF_CHARACTERS) return json({ error: 'Project Quote 已失效' }, 400);
  const event = await env.DB.prepare(
    "SELECT * FROM usage_events WHERE request_id = ? AND anon_id = ? AND status = 'quoted'",
  ).bind(requestId, identity.anonId).first();
  if (!event) return json({ error: '點數估算不存在或已使用' }, 410);
  if (Date.now() - Number(event.created_at) > QUOTE_TTL_MS) {
    await env.DB.prepare("UPDATE usage_events SET status = 'expired', completed_at = ?, error_code = 'quote_expired' WHERE request_id = ? AND status = 'quoted'")
      .bind(Date.now(), requestId).run();
    await deleteOpenAIResources(env, event);
    return json({ error: '點數估算已過期，請重新估算' }, 410);
  }
  const checks = await Promise.all([
    consumeRate(env, `generate-anon:${identity.anonId}`, numberEnv(env, 'ANON_GENERATIONS_PER_HOUR', 10, 1), 3600000),
    consumeRate(env, `generate-ip:${clientIp(request)}`, numberEnv(env, 'IP_GENERATIONS_PER_HOUR', 20, 1), 3600000),
  ]);
  if (checks.includes(false)) return json({ error: '測試生成較頻繁，請稍後再試' }, 429);

  const claim = await env.DB.prepare(
    "UPDATE usage_events SET status = 'reserving' WHERE request_id = ? AND status = 'quoted' RETURNING request_id",
  ).bind(requestId).first();
  if (!claim) return json({ error: '這份點數估算已經使用' }, 409);

  const fileRefs = JSON.parse(event.file_ids_json || '[]').map((file) => typeof file === 'string' ? { id: file, extension: '' } : file);
  const fileIds = fileRefs.map((file) => file.id);
  const reserveCost = calculateCostMicrousd({
    model: event.model, inputTokens: Number(event.input_tokens_estimated),
    outputTokens: MODEL_MAX_OUTPUT_TOKENS,
    fileSearchCalls: event.reading_mode === 'file_search' ? 1 : 0,
  });
  if (!await reserveBudget(env, reserveCost)) {
    await env.DB.prepare("UPDATE usage_events SET status = 'quoted' WHERE request_id = ? AND status = 'reserving'").bind(requestId).run();
    return json({ error: '今天的測試預算暫時不足，請稍後或明天再試' }, 429);
  }

  let vectorStoreId = null;
  try {
    if (event.reading_mode === 'file_search' && fileIds.length) vectorStoreId = await createVectorStore(env, requestId, fileIds);
    const input = event.reading_mode === 'file_search'
      ? `${brief}\n\n請先使用 File Search 檢查附件的章節與相關內容，再完成 Project 規劃。`
      : directInput(brief, fileRefs, event.visual_detail === 'high');
    const openai = await openAIRequest(env, '/responses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: event.model, background: true, store: true,
        max_output_tokens: MODEL_MAX_OUTPUT_TOKENS,
        reasoning: { effort: event.reasoning_effort },
        safety_identifier: base64Url(await hmac(identity.anonId, env.TOKEN_SECRET)).slice(0, 64),
        instructions: PROJECT_INSTRUCTIONS, input,
        ...(vectorStoreId ? { tools: [{ type: 'file_search', vector_store_ids: [vectorStoreId], max_num_results: 20 }] } : {}),
        text: { format: PROJECT_FORMAT },
      }),
    });
    await env.DB.prepare(
      "UPDATE usage_events SET status = 'running', started_at = ?, response_id = ?, vector_store_id = ?, reserved_cost_microusd = ? WHERE request_id = ? AND status = 'reserving'",
    ).bind(Date.now(), openai.id, vectorStoreId, reserveCost, requestId).run();
    return json({ ok: true, jobId: requestId, status: openai.status || 'queued' }, 202);
  } catch (error) {
    await env.DB.prepare(
      'UPDATE daily_system_usage SET reserved_cost_microusd = MAX(0, reserved_cost_microusd - ?), failure_count = failure_count + 1 WHERE day = ?',
    ).bind(reserveCost, dailyKey()).run();
    await env.DB.prepare("UPDATE usage_events SET status = 'failed', completed_at = ?, error_code = 'start_failed' WHERE request_id = ? AND status = 'reserving'")
      .bind(Date.now(), requestId).run();
    await deleteOpenAIResources(env, { ...event, vector_store_id: vectorStoreId });
    console.error('ScopeCut generation failed', error instanceof Error ? error.message : 'unknown', error?.requestId || '');
    return json({ error: 'AI 暫時無法開始生成' }, 502);
  }
}

function responseText(body) {
  if (typeof body?.output_text === 'string' && body.output_text) return body.output_text;
  for (const item of body?.output || []) for (const content of item?.content || []) {
    if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
  }
  return '';
}

function validGeneratedProject(value) {
  const plan = value?.plan;
  const prompt = value?.agent_prompt;
  const namedItems = (items) => Array.isArray(items)
    && items.every((item) => typeof item?.name === 'string' && typeof item?.purpose === 'string');
  const reasonedItems = (items, key) => Array.isArray(items)
    && items.every((item) => typeof item?.[key] === 'string' && typeof item?.reason === 'string');
  return typeof plan?.overview === 'string'
    && typeof plan?.first_version === 'string'
    && namedItems(plan.features)
    && namedItems(plan.tools)
    && reasonedItems(plan.learning, 'topic')
    && reasonedItems(plan.rationale, 'decision')
    && typeof prompt?.objective === 'string'
    && typeof prompt?.deliverable === 'string'
    && Array.isArray(prompt?.requirements)
    && prompt.requirements.every((item) => typeof item === 'string')
    && typeof prompt?.content_and_experience === 'string'
    && typeof prompt?.tools_and_execution === 'string'
    && Array.isArray(prompt?.acceptance_criteria)
    && prompt.acceptance_criteria.every((item) => typeof item === 'string');
}

async function settleUsage(env, event, response, status, errorCode = null) {
  const usage = response?.usage || {};
  const inputTokens = Number(usage.input_tokens || 0);
  const cachedTokens = Number(usage.input_tokens_details?.cached_tokens || 0);
  const outputTokens = Number(usage.output_tokens || 0);
  const reasoningTokens = Number(usage.output_tokens_details?.reasoning_tokens || 0);
  const fileSearchCalls = (response?.output || []).filter((item) => item?.type === 'file_search_call').length;
  const actualCost = calculateCostMicrousd({ model: event.model, inputTokens, cachedTokens, outputTokens, fileSearchCalls });
  const points = status === 'completed' ? pointsForCost(actualCost, numberEnv(env, 'POINT_MICROUSD', 30000, 1)) : 0;
  const band = costBand(actualCost);
  const latency = Math.max(0, Date.now() - Number(event.started_at || event.created_at));
  const predictionError = actualCost - Number(event.estimated_cost_microusd || 0);
  const predictionRatio = Number(event.estimated_cost_microusd) > 0 ? actualCost / Number(event.estimated_cost_microusd) : null;
  const claimed = await env.DB.prepare(
    `UPDATE usage_events SET status = ?, completed_at = ?, input_tokens_actual = ?, cached_input_tokens = ?,
     output_tokens_actual = ?, reasoning_tokens_actual = ?, actual_cost_microusd = ?, actual_points = ?,
     latency_ms = ?, prediction_error_microusd = ?, prediction_error_ratio = ?, cost_band = ?, error_code = ?
     WHERE request_id = ? AND status = 'running' RETURNING request_id`,
  ).bind(status, Date.now(), inputTokens, cachedTokens, outputTokens, reasoningTokens, actualCost, points,
    latency, predictionError, predictionRatio, band, errorCode, event.request_id).first();
  if (!claimed) return null;

  const bandColumn = `${band}_count`;
  const success = status === 'completed' ? 1 : 0;
  await env.DB.prepare(
    `UPDATE daily_system_usage SET reserved_cost_microusd = MAX(0, reserved_cost_microusd - ?),
     actual_cost_microusd = actual_cost_microusd + ?, success_count = success_count + ?,
     failure_count = failure_count + ?, timeout_count = timeout_count + ?, points_used = points_used + ?,
     input_tokens = input_tokens + ?, output_tokens = output_tokens + ?, reasoning_tokens = reasoning_tokens + ?,
     ${bandColumn} = ${bandColumn} + 1, max_request_cost_microusd = MAX(max_request_cost_microusd, ?),
     total_latency_ms = total_latency_ms + ? WHERE day = ?`,
  ).bind(Number(event.reserved_cost_microusd), actualCost, success, success ? 0 : 1, status === 'timeout' ? 1 : 0,
    points, inputTokens, outputTokens, reasoningTokens, actualCost, latency, event.day).run();
  await env.DB.prepare(
    `INSERT INTO daily_user_usage (anon_id, day, request_count, success_count, points_used, actual_cost_microusd, ${bandColumn})
     VALUES (?, ?, 1, ?, ?, ?, 1) ON CONFLICT(anon_id, day) DO UPDATE SET
     request_count = daily_user_usage.request_count + 1,
     success_count = daily_user_usage.success_count + excluded.success_count,
     points_used = daily_user_usage.points_used + excluded.points_used,
     actual_cost_microusd = daily_user_usage.actual_cost_microusd + excluded.actual_cost_microusd,
     ${bandColumn} = daily_user_usage.${bandColumn} + 1`,
  ).bind(event.anon_id, event.day, success, points, actualCost).run();
  return { inputTokens, cachedTokens, outputTokens, reasoningTokens, actualCost, points, band, latency };
}

async function cleanupStaleJobs(env) {
  const stale = await env.DB.prepare(
    "SELECT * FROM usage_events WHERE status = 'running' AND started_at < ? ORDER BY started_at LIMIT 5",
  ).bind(Date.now() - JOB_TIMEOUT_MS).all();
  for (const event of stale.results || []) {
    let response;
    try {
      response = await openAIRequest(env, `/responses/${encodeURIComponent(event.response_id)}`);
    } catch {
      continue;
    }
    let status = 'timeout';
    let errorCode = 'five_minute_timeout';
    if (response.status === 'completed') {
      let generated = null;
      try { generated = JSON.parse(responseText(response)); } catch {}
      status = validGeneratedProject(generated) ? 'completed' : 'failed';
      errorCode = status === 'completed' ? null : 'invalid_output';
    } else if (['failed', 'cancelled', 'incomplete'].includes(response.status)) {
      status = 'failed';
      errorCode = `openai_${response.status}`;
    } else {
      await openAIRequest(env, `/responses/${encodeURIComponent(event.response_id)}/cancel`, { method: 'POST' }).catch(() => null);
    }
    await settleUsage(env, event, response, status, errorCode);
    await deleteOpenAIResources(env, event);
  }
}

async function pollGeneration(request, env, ctx, requestId) {
  const identity = await anonymousIdentity(request, env);
  if (!identity) return json({ error: '匿名測試工作階段已失效，請重新整理' }, 401);
  const event = await env.DB.prepare('SELECT * FROM usage_events WHERE request_id = ? AND anon_id = ?').bind(requestId, identity.anonId).first();
  if (!event) return json({ error: '找不到這次生成' }, 404);
  if (event.status !== 'running') return json({ error: '這次生成已經結束', status: event.status }, 410);
  let openai;
  try { openai = await openAIRequest(env, `/responses/${encodeURIComponent(event.response_id)}`); }
  catch { return json({ error: '暫時無法取得生成狀態' }, 502); }

  if (Date.now() - Number(event.started_at) >= JOB_TIMEOUT_MS && !['completed', 'failed', 'cancelled', 'incomplete'].includes(openai.status)) {
    await openAIRequest(env, `/responses/${encodeURIComponent(event.response_id)}/cancel`, { method: 'POST' }).catch(() => null);
    const usage = await settleUsage(env, event, openai, 'timeout', 'five_minute_timeout');
    ctx.waitUntil(deleteOpenAIResources(env, event));
    return json({ error: '這次整理超過五分鐘，已停止並保留用量紀錄', status: 'timeout', usage }, 504);
  }
  if (!['completed', 'failed', 'cancelled', 'incomplete'].includes(openai.status)) return json({ ok: true, status: openai.status || 'in_progress' }, 202);
  if (openai.status !== 'completed') {
    const usage = await settleUsage(env, event, openai, 'failed', `openai_${openai.status}`);
    ctx.waitUntil(deleteOpenAIResources(env, event));
    return json({ error: 'AI 沒有完成這次生成', status: 'failed', usage }, 502);
  }
  let generated = null;
  try { generated = JSON.parse(responseText(openai)); } catch {}
  if (!validGeneratedProject(generated)) {
    const usage = await settleUsage(env, event, openai, 'failed', 'invalid_output');
    ctx.waitUntil(deleteOpenAIResources(env, event));
    return json({ error: 'AI 回傳格式不完整，請再試一次', status: 'failed', usage }, 502);
  }
  const usage = await settleUsage(env, event, openai, 'completed');
  ctx.waitUntil(deleteOpenAIResources(env, event));
  return json({
    ok: true, status: 'completed', model: event.model,
    usage: usage ? {
      points: usage.points, estimatedPoints: Number(event.estimated_points),
      prediction: usage.actualCost > Number(event.estimated_cost_microusd) ? 'higher' : 'within',
      latencyMs: usage.latency,
    } : null,
    ...generated,
  });
}

async function publicStats(env) {
  await cleanupStaleJobs(env);
  const row = await env.DB.prepare('SELECT * FROM daily_system_usage WHERE day = ?').bind(dailyKey()).first() || {};
  const budget = numberEnv(env, 'DAILY_BUDGET_MICROUSD', 3000000, 1);
  const used = Number(row.actual_cost_microusd || 0) + Number(row.reserved_cost_microusd || 0);
  return json({
    ok: true, day: dailyKey(), service: used >= budget ? 'paused' : used >= budget * 0.8 ? 'busy' : 'available',
    generated: Number(row.success_count || 0), points: Number(row.points_used || 0),
    bands: { normal: Number(row.normal_count || 0), elevated: Number(row.elevated_count || 0), heavy: Number(row.heavy_count || 0), extreme: Number(row.extreme_count || 0) },
  });
}

async function personalStats(request, env) {
  const identity = await anonymousIdentity(request, env);
  if (!identity) return json({ error: '匿名測試工作階段已失效' }, 401);
  const [today, history] = await Promise.all([
    env.DB.prepare('SELECT * FROM daily_user_usage WHERE anon_id = ? AND day = ?').bind(identity.anonId, dailyKey()).first(),
    env.DB.prepare(
      `SELECT request_id, created_at, status, estimated_points, actual_points, cost_band, latency_ms,
       file_count, prediction_error_ratio FROM usage_events WHERE anon_id = ? ORDER BY created_at DESC LIMIT 20`,
    ).bind(identity.anonId).all(),
  ]);
  return json({
    ok: true, day: dailyKey(), points: Number(today?.points_used || 0), generated: Number(today?.success_count || 0),
    history: (history.results || []).map((item) => ({
      id: item.request_id, createdAt: item.created_at, status: item.status,
      estimatedPoints: item.estimated_points, actualPoints: item.actual_points,
      band: item.cost_band, latencyMs: item.latency_ms, fileCount: item.file_count,
      estimateAccuracy: item.prediction_error_ratio == null ? null : Number(item.prediction_error_ratio),
    })),
  });
}

async function adminStats(request, env) {
  if (!await adminIdentity(request, env)) return json({ error: '需要管理者驗證' }, 401);
  const url = new URL(request.url);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('day') || '') ? url.searchParams.get('day') : dailyKey();
  const [summary, users, events] = await Promise.all([
    env.DB.prepare('SELECT * FROM daily_system_usage WHERE day = ?').bind(day).first(),
    env.DB.prepare(
      `SELECT anon_id, COUNT(*) AS request_count,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS success_count,
       SUM(input_tokens_actual) AS input_tokens, SUM(output_tokens_actual) AS output_tokens,
       SUM(reasoning_tokens_actual) AS reasoning_tokens, SUM(actual_cost_microusd) AS actual_cost_microusd,
       SUM(actual_points) AS points, AVG(latency_ms) AS average_latency_ms,
       MAX(actual_cost_microusd) AS max_cost_microusd
       FROM usage_events WHERE day = ? GROUP BY anon_id ORDER BY actual_cost_microusd DESC LIMIT 100`,
    ).bind(day).all(),
    env.DB.prepare(
      `SELECT request_id, anon_id, created_at, started_at, completed_at, status, model, reasoning_effort,
       reading_mode, input_tokens_estimated, input_tokens_actual, cached_input_tokens, output_tokens_actual,
       reasoning_tokens_actual, estimated_cost_microusd, reserved_cost_microusd, actual_cost_microusd,
       estimated_points, actual_points, latency_ms, file_count, total_file_bytes, prediction_error_microusd,
       prediction_error_ratio, cost_band, error_code FROM usage_events WHERE day = ? ORDER BY created_at DESC LIMIT 250`,
    ).bind(day).all(),
  ]);
  return json({
    ok: true,
    day,
    budgetMicrousd: numberEnv(env, 'DAILY_BUDGET_MICROUSD', 3000000, 1),
    summary: summary || {},
    users: users.results || [],
    events: events.results || [],
  });
}

async function handle(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method === 'GET' && url.pathname === '/health') return json({
    ok: true, service: 'scopecut', model: String(env.OPENAI_MODEL || 'gpt-5.6-luna'),
    dailyBudgetUsd: numberEnv(env, 'DAILY_BUDGET_MICROUSD', 3000000, 1) / 1000000,
  });
  if (request.method === 'POST' && url.pathname === '/api/session') return createAnonymousSession(env);
  if (request.method === 'POST' && url.pathname === '/api/auth/send-code') return requestOtp(request, env);
  if (request.method === 'POST' && url.pathname === '/api/auth/verify') return verifyOtpCode(request, env);
  if (request.method === 'POST' && url.pathname === '/api/quote') return quoteProject(request, env);
  if (request.method === 'POST' && url.pathname === '/api/generate') return startGeneration(request, env);
  if (request.method === 'GET' && url.pathname.startsWith('/api/jobs/')) return pollGeneration(request, env, ctx, decodeURIComponent(url.pathname.slice(10)));
  if (request.method === 'GET' && url.pathname === '/api/stats/public') return publicStats(env);
  if (request.method === 'GET' && url.pathname === '/api/stats/me') return personalStats(request, env);
  if (request.method === 'GET' && url.pathname === '/api/admin/usage') return adminStats(request, env);
  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const headers = corsHeaders(request, env);
    const origin = request.headers.get('Origin');
    if (origin && !headers['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed' }, 403);
    try {
      const response = await handle(request, env, ctx);
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

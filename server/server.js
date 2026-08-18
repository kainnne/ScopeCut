import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';

import { OPTION_GROUPS } from './options.js';
import { buildCodexPrompt, parseCodexOutput } from './prompt-builder.js';
import { runCodex, codexModel, codexEffort } from './codex.js';
import { saveAndSync, wikinbRoot } from './wikinb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

for (const dir of ['/opt/homebrew/bin', '/usr/local/bin']) {
  const parts = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  if (!parts.includes(dir) && fs.existsSync(dir)) {
    process.env.PATH = `${dir}${path.delimiter}${process.env.PATH || ''}`;
  }
}

const PORT = Number(process.env.PORT || 8788);
const AUTH_USER = process.env.SCOPECUT_AUTH_USER || '';
const AUTH_PASS = process.env.SCOPECUT_AUTH_PASS || '';
const AUTH_EMAILS = (process.env.SCOPECUT_AUTH_EMAILS || process.env.WIKINB_AUTH_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:8788,https://zx50416.github.io')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const DEV_LOG_CODE = process.env.DEV_LOG_CODE !== 'false';
const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const OTP_MAX_FAILS = 3;
const OTP_LOCK_MS = 10 * 60 * 1000;

const pendingCodes = new Map();
const sessions = new Map();
const otpGuard = { failCount: 0, lockedUntil: 0 };

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || CORS_ORIGINS.some((o) => origin === o || origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

function randomCode() {
  return String(crypto.randomInt(100000, 999999));
}
function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}
function credentialsOk(username, password) {
  if (!AUTH_USER || !AUTH_PASS) return false;
  return String(username ?? '') === AUTH_USER && String(password ?? '') === AUTH_PASS;
}
function refreshOtpLockState() {
  if (otpGuard.lockedUntil && otpGuard.lockedUntil <= Date.now()) {
    otpGuard.failCount = 0;
    otpGuard.lockedUntil = 0;
  }
}
function otpLockResponse(res) {
  refreshOtpLockState();
  if (!otpGuard.lockedUntil || otpGuard.lockedUntil <= Date.now()) return false;
  const mins = Math.max(1, Math.ceil((otpGuard.lockedUntil - Date.now()) / 60000));
  res.status(429).json({
    error: `登入已暫停,請約 ${mins} 分鐘後再試`,
    locked: true,
    lockedUntil: otpGuard.lockedUntil,
  });
  return true;
}

function smtpPass() {
  // Gmail 應用程式密碼常帶空格／引號；寄信前正規化
  return String(process.env.SMTP_PASS || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '');
}

function createSmtpTransport({ port, secure }) {
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = smtpPass();
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' },
  });
}

async function sendCodeEmail(code) {
  const subject = `ScopeCut 登入驗證碼：${code}`;
  const text = `你的 ScopeCut 登入驗證碼是：${code}\n\n10 分鐘內有效。若不是你本人操作，請忽略此信。`;
  const to = AUTH_EMAILS.length ? AUTH_EMAILS : [];
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = smtpPass();

  if (!user || !pass || to.length === 0) {
    if (DEV_LOG_CODE) {
      console.log('\n📧 [DEV] 驗證碼（未設定 SMTP 或收件信箱）:', code);
      console.log('   目標:', to.join(', ') || '(無)', '\n');
    }
    return { dev: true };
  }

  const from = String(process.env.SMTP_FROM || '').trim() || user;
  const mail = { from, to: to.join(','), subject, text };

  // 先尊重自訂 port，再回退到 Gmail 常用的 465(SSL)／587(STARTTLS)。
  // 部分網路(校園／公司)可能只允許其中一種連線方式。
  const configuredPort = Number(process.env.SMTP_PORT || 465);
  const preferred =
    Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535
      ? configuredPort
      : 465;
  const attempts = [...new Set([preferred, 465, 587])].map((port) => ({
    port,
    secure: port === 465,
  }));

  let lastErr;
  for (const attempt of attempts) {
    try {
      const transporter = createSmtpTransport(attempt);
      await transporter.sendMail(mail);
      return { dev: false, port: attempt.port };
    } catch (err) {
      lastErr = err;
      console.warn(
        `SMTP port ${attempt.port} failed:`,
        String(err?.message || err).slice(0, 160),
      );
    }
  }
  throw lastErr || new Error('SMTP 寄送失敗');
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    res.status(401).json({ error: '未登入或 session 已過期' });
    return;
  }
  req.session = session;
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({
    online: true,
    wikinbRoot: wikinbRoot(),
    model: codexModel(),
    effort: codexEffort(),
    authConfigured: Boolean(AUTH_USER && AUTH_PASS),
    smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    authEmails: AUTH_EMAILS.length,
  });
});

app.post('/api/auth/send-code', async (req, res) => {
  try {
    if (otpLockResponse(res)) return;

    if (!AUTH_USER || !AUTH_PASS) {
      res.status(500).json({ error: '尚未設定 SCOPECUT_AUTH_USER / SCOPECUT_AUTH_PASS' });
      return;
    }

    const { username, password } = req.body || {};
    if (!credentialsOk(username, password)) {
      res.status(401).json({ error: '帳號或密碼錯誤' });
      return;
    }

    const code = randomCode();
    pendingCodes.set('login', { code, expiresAt: Date.now() + CODE_TTL_MS });

    try {
      const sendResult = await sendCodeEmail(code);
      res.json({
        ok: true,
        message: sendResult.dev
          ? `帳密正確。驗證碼已顯示於 Bridge 終端機${AUTH_EMAILS.length ? `（目標 ${AUTH_EMAILS.length} 個信箱）` : ''}`
          : `帳密正確，驗證碼已寄送至 ${AUTH_EMAILS.length} 個信箱`,
        expiresIn: CODE_TTL_MS / 1000,
        failCount: otpGuard.failCount,
        dev: Boolean(sendResult.dev),
      });
    } catch (mailErr) {
      const detail = String(mailErr?.message || mailErr).slice(0, 240);
      console.error('send-code SMTP error:', detail);
      if (DEV_LOG_CODE) {
        console.log('\n📧 [FALLBACK] SMTP 失敗，驗證碼改顯示於終端機:', code);
        console.log('   原因:', detail, '\n');
        res.json({
          ok: true,
          message: '帳密正確，但寄信失敗。請用 Bridge 終端機上的驗證碼，或重啟 npm start 後再試',
          expiresIn: CODE_TTL_MS / 1000,
          failCount: otpGuard.failCount,
          dev: true,
        });
        return;
      }
      pendingCodes.delete('login');
      res.status(500).json({ error: '寄送驗證碼失敗，請稍後再試' });
    }
  } catch (err) {
    console.error('send-code error:', err);
    res.status(500).json({ error: '寄送驗證碼失敗' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  if (otpLockResponse(res)) return;

  const { code } = req.body || {};
  const pending = pendingCodes.get('login');

  if (!pending || pending.expiresAt < Date.now()) {
    res.status(400).json({ error: '驗證碼已過期，請重新寄送' });
    return;
  }

  if (String(code).trim() !== pending.code) {
    otpGuard.failCount += 1;
    const fails = otpGuard.failCount;
    if (fails >= OTP_MAX_FAILS) {
      otpGuard.lockedUntil = Date.now() + OTP_LOCK_MS;
      res.status(429).json({
        error: `累積錯誤 ${fails} 次，登入已暫停 10 分鐘`,
        failCount: fails,
        locked: true,
        lockedUntil: otpGuard.lockedUntil,
      });
      return;
    }
    res.status(400).json({
      error: `驗證碼錯誤（累積 ${fails} 次，達 ${OTP_MAX_FAILS} 次將暫停登入）`,
      failCount: fails,
    });
    return;
  }

  pendingCodes.delete('login');
  otpGuard.failCount = 0;
  otpGuard.lockedUntil = 0;
  const token = randomToken();
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS, createdAt: Date.now() });
  res.json({ ok: true, token, expiresAt: Date.now() + SESSION_TTL_MS });
});

/** 相容舊路徑：直接帳密登入已停用 */
app.post('/api/auth/login', (_req, res) => {
  res.status(400).json({ error: '請改用兩步驟登入：/api/auth/send-code → /api/auth/verify' });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, (_req, res) => {
  res.json({ ok: true, authenticated: true });
});

app.get('/api/options', authMiddleware, (_req, res) => {
  res.json({ ok: true, groups: OPTION_GROUPS, model: codexModel(), effort: codexEffort() });
});

let generating = false;

app.post('/api/generate', authMiddleware, async (req, res) => {
  const { idea, selections, extraNotes } = req.body || {};
  if (!String(idea || '').trim()) {
    res.status(400).json({ error: '請先輸入你這次的主要任務' });
    return;
  }
  if (generating) {
    res.status(409).json({ error: '已有一個任務在執行中,請等它完成' });
    return;
  }
  generating = true;

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  const send = (payload) => {
    if (!res.writableEnded) res.write(`${JSON.stringify(payload)}\n`);
  };

  const startedAt = Date.now();
  const tick = setInterval(() => {
    send({ type: 'tick', elapsedMs: Date.now() - startedAt });
  }, 5000);

  try {
    const prompt = buildCodexPrompt({ idea, selections, extraNotes });
    send({ type: 'status', message: '已組裝完整任務合約需求,交給 Codex 規劃中…' });

    const { raw, model, elapsedMs } = await runCodex(prompt, {
      cwd: path.join(__dirname, '..'),
      onStatus: (message) => send({ type: 'status', message }),
    });

    send({ type: 'status', message: '正在解析並寫入 WikiNB…' });
    const doc = parseCodexOutput(raw);
    if (!doc.body) throw new Error('Codex 回傳的文件是空的,請重試');

    const result = await saveAndSync(doc, {
      onStatus: (message) => send({ type: 'status', message }),
    });

    send({
      type: 'done',
      ok: true,
      title: doc.title,
      localPath: result.absPath,
      relPath: result.relPath,
      pageUrl: result.pageUrl,
      pushed: result.pushed,
      commit: result.commit,
      model,
      codexElapsedMs: elapsedMs,
      totalElapsedMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error('generate error:', err);
    send({ type: 'error', error: String(err.message || err).slice(0, 800) });
  } finally {
    generating = false;
    clearInterval(tick);
    if (!res.writableEnded) res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n✂️  ScopeCut Bridge on http://localhost:${PORT}`);
  console.log(`   WikiNB root: ${wikinbRoot()}`);
  console.log(`   Codex: ${codexModel()} · ${codexEffort()} · sandbox=read-only`);
  console.log(`   Auth: ${AUTH_USER && AUTH_PASS ? 'configured' : 'MISSING'}`);
  console.log(`   SMTP: ${process.env.SMTP_USER && process.env.SMTP_PASS ? 'configured' : 'DEV (codes in terminal)'}`);
  console.log(`   Auth emails: ${AUTH_EMAILS.join(', ') || '(none)'}`);
  console.log(`   CORS: ${CORS_ORIGINS.join(', ')}`);
  console.log(`   Git push: ${process.env.SCOPECUT_GIT_PUSH !== 'false'}\n`);
});

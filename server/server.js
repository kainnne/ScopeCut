import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

import { OPTION_GROUPS } from './options.js';
import { buildCodexPrompt, parseCodexOutput } from './prompt-builder.js';
import { runCodex, codexModel, codexEffort } from './codex.js';
import { saveAndSync, wikinbRoot } from './wikinb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// GUI 啟動時 PATH 可能不含 Homebrew(codex / git 需要)
for (const dir of ['/opt/homebrew/bin', '/usr/local/bin']) {
  const parts = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  if (!parts.includes(dir) && fs.existsSync(dir)) {
    process.env.PATH = `${dir}${path.delimiter}${process.env.PATH || ''}`;
  }
}

const PORT = Number(process.env.PORT || 8788);
const AUTH_USER = process.env.SCOPECUT_AUTH_USER || '';
const AUTH_PASS = process.env.SCOPECUT_AUTH_PASS || '';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 10 * 60 * 1000;

const sessions = new Map();
const loginGuard = { failCount: 0, lockedUntil: 0 };

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function refreshLock() {
  if (loginGuard.lockedUntil && loginGuard.lockedUntil <= Date.now()) {
    loginGuard.failCount = 0;
    loginGuard.lockedUntil = 0;
  }
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
  });
});

app.post('/api/auth/login', (req, res) => {
  refreshLock();
  if (loginGuard.lockedUntil > Date.now()) {
    const mins = Math.max(1, Math.ceil((loginGuard.lockedUntil - Date.now()) / 60000));
    res.status(429).json({ error: `登入已暫停,請約 ${mins} 分鐘後再試` });
    return;
  }

  if (!AUTH_USER || !AUTH_PASS) {
    res.status(500).json({ error: '尚未設定 SCOPECUT_AUTH_USER / SCOPECUT_AUTH_PASS(見 .env.example)' });
    return;
  }

  const { username, password } = req.body || {};
  if (String(username ?? '') !== AUTH_USER || String(password ?? '') !== AUTH_PASS) {
    loginGuard.failCount += 1;
    if (loginGuard.failCount >= LOGIN_MAX_FAILS) {
      loginGuard.lockedUntil = Date.now() + LOGIN_LOCK_MS;
      res.status(429).json({ error: `累積錯誤 ${loginGuard.failCount} 次,登入已暫停 10 分鐘` });
      return;
    }
    res.status(401).json({
      error: `帳號或密碼錯誤(累積 ${loginGuard.failCount} 次,達 ${LOGIN_MAX_FAILS} 次將暫停 10 分鐘)`,
    });
    return;
  }

  loginGuard.failCount = 0;
  loginGuard.lockedUntil = 0;
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS, createdAt: Date.now() });
  res.json({ ok: true, token, expiresAt: Date.now() + SESSION_TTL_MS });
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

/** 一次只跑一個任務(規劃文件生成) */
let generating = false;

app.post('/api/generate', authMiddleware, async (req, res) => {
  const { idea, selections, extraNotes } = req.body || {};
  if (!String(idea || '').trim()) {
    res.status(400).json({ error: '請先輸入你這次的主要任務(原始想法)' });
    return;
  }
  if (generating) {
    res.status(409).json({ error: '已有一個任務在執行中,請等它完成' });
    return;
  }
  generating = true;

  // NDJSON 串流:前端逐行讀取進度
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
  console.log(`\n✂️  ScopeCut running on http://localhost:${PORT}`);
  console.log(`   WikiNB root: ${wikinbRoot()}`);
  console.log(`   Codex: ${codexModel()} · ${codexEffort()}`);
  console.log(`   Auth: ${AUTH_USER && AUTH_PASS ? 'configured' : 'MISSING(請設定 .env)'}`);
  console.log(`   Git push: ${process.env.SCOPECUT_GIT_PUSH !== 'false'}\n`);
});

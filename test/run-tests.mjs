/**
 * ScopeCut 自動測試:
 * - 單元:prompt 組裝 / 輸出解析 / 檔名淨化
 * - 整合:啟動伺服器(假 Codex + 暫存 wiki 目錄,不推 git),驗證登入、權限、產生流程
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMP = path.join(__dirname, '.tmp');
const FAKE_WIKINB = path.join(TMP, 'wikinb');
const PORT = 8799;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}\n    ${err.message}`);
  }
}

// ---------- 單元測試 ----------
const { buildCodexPrompt, parseCodexOutput, META_START, META_END, MD_START, MD_END } =
  await import('../server/prompt-builder.js');
const { sanitizeStem } = await import('../server/wikinb.js');

console.log('\n單元測試');

await test('buildCodexPrompt 包含想法、選項標籤與自訂內容', () => {
  const prompt = buildCodexPrompt({
    idea: '做一個心情小任務網站',
    selections: {
      timeBudget: { values: ['60m'], custom: '' },
      techPreferences: { values: ['astro'], custom: 'Svelte 也可以' },
    },
    extraNotes: '要有貓',
  });
  assert.match(prompt, /做一個心情小任務網站/);
  assert.match(prompt, /60 分鐘/);
  assert.match(prompt, /Astro/);
  assert.match(prompt, /自訂:Svelte 也可以/);
  assert.match(prompt, /要有貓/);
  assert.match(prompt, /Definition of Done/);
});

await test('parseCodexOutput 能抽出 meta 與本文', () => {
  const raw = `一些前置雜訊\n${META_START}\n{"title":"標題","slug":"my-slug","description":"簡述","tags":["a","b"]}\n${META_END}\n${MD_START}\n# 文件說明\n\n內容\n${MD_END}\n結尾雜訊`;
  const doc = parseCodexOutput(raw);
  assert.equal(doc.title, '標題');
  assert.equal(doc.slug, 'my-slug');
  assert.deepEqual(doc.tags, ['a', 'b']);
  assert.match(doc.body, /^# 文件說明/);
});

await test('parseCodexOutput 會剝除多餘 frontmatter', () => {
  const raw = `${MD_START}\n---\ntitle: x\n---\n\n# 本文\n${MD_END}`;
  const doc = parseCodexOutput(raw);
  assert.match(doc.body, /^# 本文/);
});

await test('parseCodexOutput 缺標記時擲錯', () => {
  assert.throws(() => parseCodexOutput('沒有標記'), /標記/);
});

await test('sanitizeStem 淨化檔名', () => {
  assert.equal(sanitizeStem('2026-08-03-my slug!@#'), '2026-08-03-my-slug');
  assert.equal(sanitizeStem('中文 標題'), '中文-標題');
  assert.ok(sanitizeStem('') .startsWith('project-'));
  assert.ok(sanitizeStem('index').startsWith('project-'));
});

// ---------- 整合測試 ----------
console.log('\n整合測試(假 Codex + 暫存 wiki)');

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(path.join(FAKE_WIKINB, 'wiki'), { recursive: true });
fs.writeFileSync(
  path.join(FAKE_WIKINB, 'wiki', 'index.md'),
  '# 索引\n\n> 最後更新:2026-01-01\n\n## 筆記\n\n- [[Old/note]] — 舊筆記\n\n## 元資料\n\n(無)\n',
  'utf8',
);
fs.writeFileSync(path.join(FAKE_WIKINB, 'wiki', '_meta.json'), '{}\n', 'utf8');

const server = spawn('node', [path.join(ROOT, 'server', 'server.js')], {
  env: {
    ...process.env,
    PORT: String(PORT),
    SCOPECUT_AUTH_USER: 'testuser',
    SCOPECUT_AUTH_PASS: 'testpass',
    WIKINB_ROOT: FAKE_WIKINB,
    SCOPECUT_GIT_PUSH: 'false',
    SCOPECUT_FAKE_CODEX: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (c) => { serverLog += c; });
server.stderr.on('data', (c) => { serverLog += c; });

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch { /* 還沒起來 */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`伺服器未啟動:\n${serverLog}`);
}

try {
  await waitForServer();

  await test('health 回報設定', async () => {
    const res = await fetch(`${BASE}/api/health`);
    const data = await res.json();
    assert.equal(data.online, true);
    assert.equal(data.authConfigured, true);
    assert.equal(data.wikinbRoot, FAKE_WIKINB);
  });

  await test('錯誤帳密被拒絕', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'x', password: 'y' }),
    });
    assert.equal(res.status, 401);
  });

  let token = '';
  await test('正確帳密取得 token', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'testpass' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token?.length >= 32);
    token = data.token;
  });

  await test('未登入不能取得選項與產生文件', async () => {
    const res1 = await fetch(`${BASE}/api/options`);
    assert.equal(res1.status, 401);
    const res2 = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: 'x' }),
    });
    assert.equal(res2.status, 401);
  });

  await test('登入後可取得選項定義', async () => {
    const res = await fetch(`${BASE}/api/options`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    assert.ok(Array.isArray(data.groups) && data.groups.length >= 10);
    assert.ok(data.groups.every((g) => g.id && g.label && Array.isArray(g.options)));
  });

  await test('沒有想法時回 400', async () => {
    const res = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: '  ' }),
    });
    assert.equal(res.status, 400);
  });

  let doneEvent = null;
  await test('產生流程:NDJSON 串流回報並完成', async () => {
    const res = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: '測試點子',
        selections: { timeBudget: { values: ['30m'], custom: '' } },
        extraNotes: '',
      }),
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    const events = text.trim().split('\n').map((l) => JSON.parse(l));
    doneEvent = events.find((e) => e.type === 'done');
    const errEvent = events.find((e) => e.type === 'error');
    assert.ok(!errEvent, `不應有錯誤:${errEvent?.error}`);
    assert.ok(doneEvent, '應有 done 事件');
    assert.equal(doneEvent.pushed, false);
  });

  await test('文件已寫入 wiki/Projects 且格式正確', () => {
    assert.ok(doneEvent);
    assert.ok(fs.existsSync(doneEvent.localPath), `檔案不存在:${doneEvent.localPath}`);
    const content = fs.readFileSync(doneEvent.localPath, 'utf8');
    assert.match(content, /^---\ntitle: 測試專案合約/);
    assert.match(content, /# 文件說明/);
    assert.ok(doneEvent.relPath.startsWith('wiki/Projects/'));
  });

  await test('_meta.json 與 index.md 已更新', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(FAKE_WIKINB, 'wiki', '_meta.json'), 'utf8'));
    const key = doneEvent.relPath.replace(/^wiki\//, '').replace(/\.md$/, '');
    assert.ok(meta[key], `_meta.json 缺 ${key}`);
    assert.equal(meta[key].title, '測試專案合約');
    const index = fs.readFileSync(path.join(FAKE_WIKINB, 'wiki', 'index.md'), 'utf8');
    assert.ok(index.includes(`[[${key}]]`), 'index.md 缺連結');
    assert.ok(index.includes('[[Old/note]]'), '不可弄丟既有連結');
    assert.ok(index.indexOf(`[[${key}]]`) < index.indexOf('## 元資料'), '連結應在「## 筆記」區');
  });

  await test('登出後 token 失效', async () => {
    const res = await fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const res2 = await fetch(`${BASE}/api/options`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res2.status, 401);
  });
} finally {
  server.kill('SIGTERM');
}

console.log(`\n結果:${passed} 通過,${failed} 失敗\n`);
process.exit(failed > 0 ? 1 : 0);

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { META_START, META_END, MD_START, MD_END } from './prompt-builder.js';

function readCodexConfigValue(key, fallback) {
  try {
    const cfgPath = path.join(process.env.HOME || '', '.codex', 'config.toml');
    if (!fs.existsSync(cfgPath)) return fallback;
    const text = fs.readFileSync(cfgPath, 'utf8');
    const m = text.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]+)"`, 'm'));
    return m?.[1] || fallback;
  } catch {
    return fallback;
  }
}

export function codexModel() {
  return process.env.CODEX_MODEL?.trim() || readCodexConfigValue('model', 'gpt-5.6-sol');
}

export function codexEffort() {
  return (
    process.env.CODEX_REASONING_EFFORT?.trim() ||
    readCodexConfigValue('model_reasoning_effort', 'high')
  );
}

const FAKE_OUTPUT = `${META_START}
{"title": "測試專案合約", "slug": "scopecut-fake-test", "description": "SCOPECUT_FAKE_CODEX 產生的固定測試內容", "tags": ["測試"]}
${META_END}
${MD_START}
# 文件說明

這是 ScopeCut 測試模式產生的固定文件。

---

## System Role

你是一位資深工程師,直接實作。

## Definition of Done

- 測試通過。
${MD_END}`;

/**
 * 執行 codex exec,回傳 { raw, model, effort, elapsedMs }。
 * onStatus(message) 供上層回報進度。
 */
export function runCodex(prompt, { cwd, onStatus } = {}) {
  const model = codexModel();
  const effort = codexEffort();
  const timeoutMs = Number(process.env.CODEX_TIMEOUT_MS || 900000);

  if (process.env.SCOPECUT_FAKE_CODEX === '1' || process.env.SCOPECUT_FAKE_CODEX === 'true') {
    onStatus?.(`測試模式:略過真實 Codex(${model})`);
    return Promise.resolve({ raw: FAKE_OUTPUT, model, effort, elapsedMs: 0 });
  }

  const args = [
    'exec',
    '--color', 'never',
    '--sandbox', 'read-only',
    '--ephemeral',
    '--skip-git-repo-check',
    '-m', model,
    '-c', `model_reasoning_effort="${effort}"`,
    '-',
  ];

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    onStatus?.(`正在啟動 Codex(${model} · ${effort} · read-only)…`);

    // 強制唯讀：Codex 只能產出文字合約，不可改本機任何檔案。
    // 寫入 wiki/Projects 由 ScopeCut 後端專責處理。
    const child = spawn('codex', args, {
      cwd: cwd || process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const killTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      setTimeout(() => { if (!child.killed) child.kill('SIGKILL'); }, 1500);
      reject(new Error(`Codex 超過 ${Math.round(timeoutMs / 60000)} 分鐘未完成,已停止`));
    }, timeoutMs);

    child.stdout.on('data', (c) => { stdout += c.toString('utf8'); });
    child.stderr.on('data', (c) => { stderr += c.toString('utf8'); });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      reject(new Error(`無法啟動 Codex CLI:${err.message}。請確認已安裝並以 ChatGPT 帳號登入。`));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      const elapsedMs = Date.now() - startedAt;
      if (code !== 0 && !stdout.includes(MD_END)) {
        reject(new Error(`Codex 執行失敗(exit ${code}):${(stderr || stdout).slice(-500)}`));
        return;
      }
      onStatus?.(`Codex 完成(${Math.round(elapsedMs / 1000)} 秒)`);
      resolve({ raw: stdout, model, effort, elapsedMs });
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

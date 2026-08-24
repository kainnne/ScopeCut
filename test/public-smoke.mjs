import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, dashboardHtml, css, app, dashboard, worker, schema, wrangler] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/dashboard.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../public/dashboard.js', import.meta.url), 'utf8'),
  readFile(new URL('../worker/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../worker/schema.sql', import.meta.url), 'utf8'),
  readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
]);

const checks = [
  ['首頁保留九階段客製化 AI Project 訪談', () => {
    assert.match(html, /免費完成你的[\s\S]*客製化 AI project/);
    assert.match(html, />1 \/ 9</);
    assert.match(app, /Project 概念[\s\S]*目標與成果[\s\S]*其他備註[\s\S]*確認/);
  }],
  ['主要輸入使用收合選項並保留自由輸入', () => {
    assert.match(app, /<details class="option-group"/);
    assert.match(app, /產品與工具[\s\S]*內容與表達[\s\S]*社群與服務/);
    assert.match(app, /補充你的想法[\s\S]*情境補充（選填）/);
  }],
  ['一般測試生成不要求 Email 登入', () => {
    assert.doesNotMatch(html, /auth-dialog|Kainnne 測試登入|autocomplete="one-time-code"/);
    assert.match(app, /\/api\/session/);
    assert.match(app, /X-ScopeCut-Anonymous/);
    assert.match(app, /localStorage\.setItem\(ANON_KEY/);
  }],
  ['附件支援文件、PDF、簡報與試算表', () => {
    assert.match(app, /id="material-files"/);
    assert.match(app, /\.pdf,.txt,.md/);
    assert.match(app, /附件中的圖表、版面或小字很重要/);
    assert.match(worker, /MAX_TOTAL_FILE_BYTES = 50 \* 1024 \* 1024/);
  }],
  ['生成前先精確估算並顯示模擬點數', () => {
    assert.match(worker, /\/responses\/input_tokens/);
    assert.match(app, /\/api\/quote/);
    assert.match(app, /使用測試點數/);
    assert.match(worker, /estimated_cost_microusd/);
  }],
  ['每日預算使用保留與實際結算而非固定次數', () => {
    assert.match(worker, /reserveBudget/);
    assert.match(worker, /reserved_cost_microusd/);
    assert.match(worker, /actual_cost_microusd/);
    assert.match(wrangler, /"DAILY_BUDGET_MICROUSD": "3000000"/);
    assert.doesNotMatch(wrangler, /DAILY_GENERATION_LIMIT|OPENAI_MAX_OUTPUT_TOKENS/);
  }],
  ['極大型附件改用 File Search', () => {
    assert.match(worker, /LONG_CONTEXT_THRESHOLD = 272000/);
    assert.match(worker, /readingMode = inputTokens > LONG_CONTEXT_THRESHOLD \? 'file_search'/);
    assert.match(worker, /vector_stores/);
  }],
  ['背景生成有五分鐘 timeout 且不使用短 output 限制', () => {
    assert.match(worker, /background: true/);
    assert.match(worker, /MODEL_MAX_OUTPUT_TOKENS = 128000/);
    assert.match(worker, /JOB_TIMEOUT_MS = 5 \* 60 \* 1000/);
    assert.match(worker, /cleanupStaleJobs/);
  }],
  ['輸出分為作者企劃與可直接交給 Agent 的內容', () => {
    assert.match(worker, /required: \['plan', 'agent_prompt'\]/);
    assert.match(worker, /overview[\s\S]*first_version[\s\S]*features[\s\S]*tools[\s\S]*learning[\s\S]*rationale/);
    assert.match(worker, /objective[\s\S]*deliverable[\s\S]*requirements[\s\S]*content_and_experience[\s\S]*tools_and_execution[\s\S]*acceptance_criteria/);
    assert.match(app, /直接交給 AI Agent[\s\S]*複製 Prompt[\s\S]*完整 Prompt[\s\S]*專案說明/);
    assert.match(app, /專案目標[\s\S]*成品[\s\S]*核心需求[\s\S]*內容與體驗[\s\S]*工具與執行[\s\S]*完成標準/);
    assert.match(app, /currentAgentPrompt/);
    assert.match(worker, /小型單頁網站，預設使用 HTML、CSS 與原生 JavaScript/);
    assert.match(worker, /學習建議只放在 plan\.learning/);
  }],
  ['預估與實際差異完整保存', () => {
    assert.match(schema, /prediction_error_microusd/);
    assert.match(schema, /prediction_error_ratio/);
    assert.match(worker, /estimatedPoints[\s\S]*prediction/);
  }],
  ['公開、個人、管理三層 Dashboard 存在', () => {
    assert.match(dashboardHtml, /data-tab="public"[\s\S]*data-tab="personal"[\s\S]*data-tab="admin"/);
    assert.match(worker, /\/api\/stats\/public/);
    assert.match(worker, /\/api\/stats\/me/);
    assert.match(worker, /\/api\/admin\/usage/);
  }],
  ['公開與個人 Dashboard 不回傳美元和 token', () => {
    assert.match(dashboard, /money\(microusd\)/);
    assert.match(worker, /async function adminStats/);
    assert.doesNotMatch(worker.match(/async function publicStats[\s\S]*?async function personalStats/)?.[0] || '', /actual_cost_microusd:\s|input_tokens:/);
  }],
  ['管理 Dashboard 使用 Kainnne OTP 且金鑰不在原始碼', () => {
    assert.match(dashboard, /\/api\/auth\/send-code/);
    assert.match(dashboard, /\/api\/auth\/verify/);
    assert.match(worker, /ScopeCut <login@auth\.kainnne\.com>/);
    assert.match(worker, /env\.OPENAI_API_KEY/);
    assert.doesNotMatch(`${html}\n${app}\n${dashboard}\n${worker}\n${wrangler}`, /sk-[A-Za-z0-9_-]{12,}|re_[A-Za-z0-9]{12,}/);
  }],
  ['用量資料採單一 D1 schema 與研究事件表', () => {
    assert.match(schema, /CREATE TABLE IF NOT EXISTS anonymous_users/);
    assert.match(schema, /CREATE TABLE IF NOT EXISTS usage_events/);
    assert.match(schema, /CREATE TABLE IF NOT EXISTS daily_system_usage/);
    assert.match(schema, /CREATE TABLE IF NOT EXISTS runtime_config/);
  }],
  ['手機版與 reduced motion 樣式存在', () => {
    assert.match(css, /@media \(max-width: 620px\)/);
    assert.match(css, /prefers-reduced-motion/);
    assert.match(css, /dashboard-panel/);
  }],
];

console.log('\nScopeCut public smoke tests');
for (const [label, check] of checks) {
  check();
  console.log(`  ✓ ${label}`);
}

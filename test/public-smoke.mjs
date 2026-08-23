import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, app, worker, wrangler] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../worker/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
]);

const checks = [
  ['公開網址與 canonical 一致', () => assert.match(html, /https:\/\/scopecut\.kainnne\.com\//)],
  ['首頁呈現新的客製化 AI Project 定位', () => assert.match(html, /免費完成你的[\s\S]*客製化 AI project/)],
  ['訪客使用九階段 Project 訪談', () => {
    assert.match(html, />1 \/ 9</);
    assert.match(app, /Project 概念[\s\S]*目標與成果[\s\S]*執行條件[\s\S]*確認/);
  }],
  ['不再詢問使用者經驗與完成時間', () => {
    assert.doesNotMatch(app, /你有多少經驗和時間|一個晚上|一個週末|一週左右/);
  }],
  ['登入畫面說明封閉測試與 Project Brief 保存', () => assert.match(html, /目前僅開放指定測試帳號，Project Brief 已保存/)],
  ['登入使用六位數 Email 驗證碼', () => {
    assert.match(html, /autocomplete="one-time-code"/);
    assert.match(app, /\/api\/auth\/send-code/);
    assert.match(app, /\/api\/auth\/verify/);
  }],
  ['付款入口標示為預覽', () => assert.match(html, /購買點數尚未開放[\s\S]*目前僅供預覽/)],
  ['首頁沒有多餘說明區塊', () => assert.doesNotMatch(html, /how-section|trust-strip|example-section|pricing-section|kainnne-section/)],
  ['公開前端未連線舊本機 Bridge', () => assert.doesNotMatch(app, /localhost:8788|127\.0\.0\.1:8788/)],
  ['API session 僅保存在當次瀏覽工作階段', () => assert.match(app, /sessionStorage\.setItem\(SESSION_KEY/)],
  ['正式 API 已連線且寄件密鑰不在原始碼', () => {
    assert.match(html, /https:\/\/scopecut-auth\.chaos60649\.workers\.dev/);
    assert.match(worker, /env\.RESEND_API_KEY/);
    assert.doesNotMatch(`${html}\n${app}\n${worker}\n${wrangler}`, /re_[A-Za-z0-9]{12,}/);
  }],
  ['免費點數由後端限制', () => {
    assert.match(worker, /daily_usage/);
    assert.match(worker, /daily_usage\.used < \?/);
    assert.match(app, /\/api\/usage\/consume/);
  }],
  ['Project Prompt 使用完整 Brief 且不加入通用裝置限制', () => {
    assert.match(app, /請根據以下 Project Brief/);
    assert.match(app, /Project 概念[\s\S]*目標使用者與情境[\s\S]*第一版必須包含/);
    assert.doesNotMatch(app, /手機與電腦上正常操作/);
  }],
  ['封閉測試帳號由 Worker 後端限制', () => {
    assert.match(worker, /allowedEmail\(env, email\)/);
    assert.match(wrangler, /"ALLOWED_EMAILS"/);
  }],
  ['手機版與 reduced motion 樣式存在', () => {
    assert.match(css, /@media \(max-width: 620px\)/);
    assert.match(css, /prefers-reduced-motion/);
  }],
];

console.log('\n公開前端 smoke tests');
for (const [label, check] of checks) {
  check();
  console.log(`  ✓ ${label}`);
}

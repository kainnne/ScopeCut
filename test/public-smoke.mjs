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
  ['訪客先完成五步整理', () => assert.match(html, />1 \/ 5</)],
  ['登入畫面說明草稿會保留', () => assert.match(html, /草稿已保存/)],
  ['登入使用六位數 Email 驗證碼', () => {
    assert.match(html, /autocomplete="one-time-code"/);
    assert.match(app, /\/api\/auth\/send-code/);
    assert.match(app, /\/api\/auth\/verify/);
  }],
  ['付款入口不會誤導扣款', () => assert.match(html, /不會扣款/)],
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
  ['Scope Pack Prompt 保持簡短自主', () => assert.match(app, /其他細節採用簡單合理的做法/)],
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

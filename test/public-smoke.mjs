import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, app] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
]);

const checks = [
  ['公開網址與 canonical 一致', () => assert.match(html, /https:\/\/scopecut\.kainnne\.com\//)],
  ['訪客先完成五步整理', () => assert.match(html, /STEP 1 \/ 5/)],
  ['登入畫面說明草稿會保留', () => assert.match(html, /YOUR DRAFT IS SAFE/)],
  ['付款入口標示為預覽', () => assert.match(html, /PAYMENT PREVIEW/)],
  ['公開前端未連線舊本機 Bridge', () => assert.doesNotMatch(app, /localhost:8788|127\.0\.0\.1:8788/)],
  ['Scope Pack Prompt 保持簡短自主', () => assert.match(app, /遇到不影響核心成果的細節/)],
  ['手機版與 reduced motion 樣式存在', () => {
    assert.match(css, /@media\(max-width:720px\)/);
    assert.match(css, /prefers-reduced-motion/);
  }],
];

console.log('\n公開前端 smoke tests');
for (const [label, check] of checks) {
  check();
  console.log(`  ✓ ${label}`);
}

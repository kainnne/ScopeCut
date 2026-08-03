/**
 * UI 選項定義:前端據此渲染,後端據此組 Prompt。
 * 每組 allowCustom: true 代表提供「自訂…」輸入管道。
 */
export const OPTION_GROUPS = [
  {
    id: 'timeBudget',
    label: '可投入時間',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '例如:兩個晚上、3 小時',
    options: [
      { id: '15m', label: '15 分鐘', hint: '單一靜態頁面或單一腳本' },
      { id: '30m', label: '30 分鐘', hint: '一個核心互動' },
      { id: '45m', label: '45 分鐘', hint: '一個完整單頁工具' },
      { id: '60m', label: '60 分鐘', hint: '完整小型網站或程式' },
      { id: '90m', label: '90 分鐘', hint: '可加入基本儲存或簡單 API' },
      { id: 'half-day', label: '半天', hint: '可包含部署、測試與較完整文件' },
    ],
    default: '60m',
  },
  {
    id: 'energy',
    label: '目前精神狀態',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '描述你現在的狀態',
    options: [
      { id: 'exhausted', label: '腦袋已死', hint: '功能最多 2 個,不做後端與資料庫' },
      { id: 'tired', label: '有點累', hint: '功能最多 3 個,優先單頁 + localStorage' },
      { id: 'normal', label: '普通', hint: '功能最多 4 個,可用一個簡單 API' },
      { id: 'energetic', label: '很有精神', hint: '功能最多 5 個,可加 serverless function' },
      { id: 'challenge', label: '今天想挑戰', hint: '可用一項不熟技術,但不得擴充範圍' },
    ],
    default: 'normal',
  },
  {
    id: 'projectTypes',
    label: '專案類型(最多 2 個)',
    type: 'multi',
    maxSelect: 2,
    allowCustom: true,
    customPlaceholder: '自訂類型',
    options: [
      { id: 'utility', label: '實用小工具' },
      { id: 'fun', label: '廢廢有趣網站' },
      { id: 'prompt-tool', label: 'AI Prompt 工具' },
      { id: 'interactive-text', label: '互動文字作品' },
      { id: 'education', label: '教育工具' },
      { id: 'dataviz', label: '資料視覺化' },
      { id: 'music', label: '音樂工具' },
      { id: 'creative', label: '創作工具' },
      { id: 'devtool', label: '開發者工具' },
      { id: 'doc-generator', label: '文件生成器' },
      { id: 'productivity', label: '個人效率工具' },
      { id: 'random', label: '隨機決定' },
    ],
    default: ['utility'],
  },
  {
    id: 'outputType',
    label: '最終作品形式',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '自訂形式',
    options: [
      { id: 'static-site', label: '靜態網站' },
      { id: 'spa', label: '單頁 Web App' },
      { id: 'local-webapp', label: '本機 Web App' },
      { id: 'cli', label: 'CLI 工具' },
      { id: 'python-script', label: 'Python 腳本' },
      { id: 'node-tool', label: 'Node.js 工具' },
      { id: 'browser-extension', label: 'Browser Extension' },
      { id: 'md-generator', label: 'Markdown 產生器' },
      { id: 'small-api', label: '小型 API' },
      { id: 'ai-decide', label: '由 AI 根據時間決定' },
    ],
    default: 'spa',
  },
  {
    id: 'techPreferences',
    label: '技術偏好(可複選)',
    type: 'multi',
    allowCustom: true,
    customPlaceholder: '自訂技術,例如 Svelte、Go',
    options: [
      { id: 'astro', label: 'Astro' },
      { id: 'react', label: 'React' },
      { id: 'nextjs', label: 'Next.js' },
      { id: 'vue', label: 'Vue' },
      { id: 'vanilla-ts', label: 'Vanilla TypeScript' },
      { id: 'python', label: 'Python' },
      { id: 'nodejs', label: 'Node.js' },
      { id: 'tailwind', label: 'Tailwind CSS' },
      { id: 'sqlite', label: 'SQLite' },
      { id: 'localstorage', label: 'localStorage' },
      { id: 'ai-decide', label: '不指定,交給 Agent 決定' },
    ],
    default: ['ai-decide'],
  },
  {
    id: 'aiMode',
    label: 'AI 使用方式',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '自訂,例如 Ollama 本機模型',
    options: [
      { id: 'none', label: '完全不使用 LLM' },
      { id: 'rules', label: '使用固定規則' },
      { id: 'openai', label: '使用 OpenAI API' },
      { id: 'gemini', label: '使用 Gemini API' },
      { id: 'agent-content', label: '只由 Agent 生成內容' },
      { id: 'interface-only', label: '先保留介面,不接 API' },
      { id: 'cost-decide', label: '由 Agent 根據成本決定' },
    ],
    default: 'none',
  },
  {
    id: 'storage',
    label: '資料儲存',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '自訂儲存方式',
    options: [
      { id: 'none', label: '不儲存' },
      { id: 'localstorage', label: 'localStorage' },
      { id: 'json-file', label: 'JSON 檔' },
      { id: 'sqlite', label: 'SQLite' },
      { id: 'serverless-db', label: 'Serverless Database' },
      { id: 'ai-decide', label: '由 Agent 決定' },
    ],
    default: 'localstorage',
  },
  {
    id: 'uiStyle',
    label: 'UI 風格',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '自訂風格描述',
    options: [
      { id: 'minimal-formal', label: '極簡正式' },
      { id: 'soft-healing', label: '溫和療癒' },
      { id: 'dark-engineering', label: '深色工程感' },
      { id: 'editor', label: '編輯器風格' },
      { id: 'notion-doc', label: 'Notion／文件風格' },
      { id: 'card-product', label: '卡片式產品介面' },
      { id: 'sassy-pro', label: '有點嘴但仍專業' },
      { id: 'edu-kcis', label: '康橋／教育工具風格' },
      { id: 'wikinb', label: '參考 WikiNB' },
      { id: 'ai-decide', label: '由 Agent 決定' },
    ],
    default: 'ai-decide',
  },
  {
    id: 'maturity',
    label: '專案成熟度',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '自訂成熟度要求',
    options: [
      { id: 'prototype', label: '快速 Prototype', hint: '核心流程可用 + 基本 README' },
      { id: 'share-friends', label: '可以分享給朋友', hint: 'UI 完整、有操作說明、基本測試' },
      { id: 'portfolio', label: '可以放作品集', hint: '視覺一致、README 完整、有部署說明' },
      { id: 'internal-tool', label: '正式內部工具', hint: '輸入驗證、錯誤處理、技術文件' },
      { id: 'kcis-demo', label: '康橋 Demo', hint: '文案得體、可連結教育應用' },
    ],
    default: 'share-friends',
  },
  {
    id: 'testLevel',
    label: '驗收強度',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '自訂驗收要求',
    options: [
      { id: 'basic', label: '基本可用' },
      { id: 'build-pass', label: 'Build 必須通過' },
      { id: 'core-flow', label: '核心流程測試' },
      { id: 'full-auto', label: '完整自動測試' },
      { id: 'ai-decide', label: 'Agent 自行決定合理測試' },
    ],
    default: 'core-flow',
  },
  {
    id: 'githubMode',
    label: 'GitHub 交付',
    type: 'single',
    allowCustom: true,
    customPlaceholder: '自訂,例如推到指定 repo 名稱',
    options: [
      { id: 'no-git', label: '不使用 Git' },
      { id: 'local-commit', label: '只建立本地 Git commit' },
      { id: 'push-existing', label: 'Push 到既有 repository' },
      { id: 'new-private', label: '建立新的 private repository' },
      { id: 'new-public', label: '建立新的 public repository' },
      { id: 'commands-only', label: '只產生 Git 指令,由使用者手動執行' },
    ],
    default: 'local-commit',
  },
  {
    id: 'referenceProjects',
    label: '參考既有專案(可複選)',
    type: 'multi',
    allowCustom: true,
    customPlaceholder: '自訂路徑或 repo',
    options: [
      { id: 'none', label: '不參考' },
      { id: 'wikinb', label: '參考 WikiNB' },
      { id: 'cwd', label: '參考目前工作目錄' },
      { id: 'ui-only', label: '只參考 UI' },
      { id: 'readme-only', label: '只參考 README' },
      { id: 'deploy-only', label: '只參考部署方式' },
    ],
    default: ['none'],
  },
];

/** 依 group id 取出定義 */
export function getGroup(id) {
  return OPTION_GROUPS.find((g) => g.id === id) || null;
}

/**
 * 將前端送來的 selections 轉成人類可讀敘述(供 Prompt 使用)。
 * selections 形如 { timeBudget: { values: ['60m'], custom: '' }, ... }
 */
export function describeSelections(selections = {}) {
  const lines = [];
  for (const group of OPTION_GROUPS) {
    const sel = selections[group.id] || {};
    const values = Array.isArray(sel.values) ? sel.values : [];
    const custom = String(sel.custom || '').trim();
    const labels = values
      .map((v) => group.options.find((o) => o.id === v)?.label || v)
      .filter(Boolean);
    if (custom) labels.push(`自訂:${custom}`);
    if (labels.length === 0) labels.push('(未選,由 Agent 用最小合理預設)');
    lines.push(`- ${group.label}:${labels.join('、')}`);
  }
  return lines.join('\n');
}

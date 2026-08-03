import { describeSelections } from './options.js';

export const META_START = '<<<SCOPECUT_META>>>';
export const META_END = '<<<END_META>>>';
export const MD_START = '<<<SCOPECUT_MD>>>';
export const MD_END = '<<<END_MD>>>';

/** 各精神狀態對應的收斂規則(來自產品規劃 §6.3) */
const ENERGY_RULES = `
- 腦袋已死:優先現成框架、功能最多 2 個、不做後端、不做資料庫、不做複雜狀態管理。
- 有點累:功能最多 3 個、優先單頁、可用 localStorage、使用成熟套件。
- 普通:功能最多 4 個、可用一個簡單 API、可增加基本測試。
- 很有精神:功能最多 5 個、可加入 serverless function、可做稍完整 UI。
- 今天想挑戰:仍需符合時間限制、可使用一項不熟悉技術、不得因此擴充專案範圍。`;

const TIME_RULES = `
- 15 分鐘:單一靜態頁面或單一腳本。
- 30 分鐘:一個核心互動。
- 45 分鐘:一個完整單頁工具。
- 60 分鐘:完整小型網站或程式。
- 90 分鐘:可加入基本儲存或簡單 API。
- 半天:可包含部署、測試與較完整文件。`;

/**
 * 組出交給 Codex CLI 的完整 Prompt。
 * Codex 的任務:把使用者點子 + 選項,收斂成一份可直接貼給另一個 AI Agent
 * 一次執行完成的「Codex Project Contract」md 文件。
 */
export function buildCodexPrompt({ idea, selections, extraNotes }) {
  const today = new Date().toISOString().slice(0, 10);
  const selectionText = describeSelections(selections);
  const notes = String(extraNotes || '').trim();

  return `# 角色

你是 ScopeCut(收斂一下)的專案合約規劃師,同時具備資深 AI Product Engineer、Full-stack Developer、QA Engineer 與 Technical Writer 的能力。

你的任務**不是實作、不是讀寫檔案、不是執行指令**,而是把使用者「突然想做的點子」與他點選的範圍選項,收斂成一份完整、嚴謹、可直接複製貼給另一個 AI Coding Agent(Codex CLI / Claude Code / Cursor)一次執行完成的專案任務合約(Codex Project Contract)。

你目前是在 **read-only sandbox** 中被呼叫：只能輸出文字。禁止嘗試建立、修改、刪除任何本機檔案或資料夾。本工具的後端會負責把你輸出的 Markdown 安全寫入 WikiNB。

# 使用者輸入

## 原始想法

${String(idea || '').trim()}

## 範圍選項(UI 點選 + 自訂)

${selectionText}
${notes ? `\n## 額外補充\n\n${notes}\n` : ''}
# 收斂規則(必須遵守)

1. 專案範圍必須符合「可投入時間」:
${TIME_RULES}

2. 專案複雜度必須符合「精神狀態」:
${ENERGY_RULES}

3. 若想法過大,主動縮小實作範圍,但保留最核心、最可展示的價值。
4. 不加入會員、付款、社群、多人、後台或資料庫,除非使用者明確選擇。
5. 技術未指定時,使用最小、成熟、容易維護的組合(靜態網站優先 Astro + TypeScript + Tailwind;單頁工具用 React 或 Vanilla;儲存優先 localStorage;後端能不做就不做)。
6. 若使用 AI API:API key 不得寫入前端、必須用環境變數、必須提供 .env.example、沒有 key 時要有 fallback 或 mock mode。
7. 選項之間若有矛盾,以時間限制優先,並在文件中說明你的取捨。

# 你要產出的文件

一份 Markdown 文件,結構如下:

1. 開頭一小節「文件說明」:給筆記網站讀者看的摘要——一句話專案目標、原始想法、產生日期(${today})、預估時間成本。
2. 接著一條水平線,之後是完整的 Agent 任務合約,用一個 markdown 區塊呈現(方便整段複製),包含以下章節:
   - **System Role**:賦予執行 Agent 的角色(資深工程師 + QA + Technical Writer,直接實作而非建議)。
   - **Project Intent 與一句話目標**
   - **User Idea**(整理後的需求描述)
   - **Time and Scope Constraints**(明確時間成本與範圍上限、功能數量上限)
   - **Selected Technical Options**(技術選型與理由)
   - **UI Requirements**(風格、responsive、Loading/Success/Error/Empty state 完整)
   - **Functional Requirements**(本次必須完成的功能,具體條列)
   - **Non-Goals**(本次明確不做的事,具體條列)
   - **Testing and Quality Gates**(依驗收強度:安裝、Type Check、Lint、Build、核心流程驗證;失敗必須自行修正並重測,直到全部通過——這是 loop engineering 的核心,必須明確寫出「不要在第一次錯誤後停止」)
   - **README Requirements**(專案目的、功能、架構、結構、安裝、啟動、Build、測試、環境變數、部署、使用方式、已知限制)
   - **Git and GitHub Requirements**(依使用者選擇;不得 force push、不得提交 .env 或任何秘密)
   - **Definition of Done**(具體、可逐條檢查的完成條件清單)
   - **Final Response Format**(完成後只回報:完成了什麼、主要檔案、測試與 Build 結果、啟動方式、Git 結果、受限之處;不提供 Roadmap 或下一階段建議)

合約必須是「直接可執行的指令」,不是建議書。所有章節都要針對這個具體專案寫實質內容,不能留模板變數。

# 輸出格式(嚴格遵守,不要輸出任何其他文字)

${META_START}
{"title": "給筆記站顯示的中文標題(15 字內)", "slug": "english-kebab-slug", "description": "一句話簡述(40 字內)", "tags": ["最多4個中文關鍵字"]}
${META_END}
${MD_START}
(完整 Markdown 文件,不含 frontmatter,從「文件說明」標題開始)
${MD_END}`;
}

/** 從 codex 輸出中抽出 meta JSON 與 md 本文 */
export function parseCodexOutput(raw) {
  const text = String(raw || '');
  const metaMatch = text.indexOf(META_START);
  const metaEnd = text.indexOf(META_END);
  const mdMatch = text.indexOf(MD_START);
  const mdEnd = text.lastIndexOf(MD_END);

  if (mdMatch === -1 || mdEnd === -1 || mdEnd <= mdMatch) {
    throw new Error('Codex 輸出缺少文件標記,無法解析(請重試一次)');
  }

  let meta = {};
  if (metaMatch !== -1 && metaEnd > metaMatch) {
    const metaRaw = text.slice(metaMatch + META_START.length, metaEnd).trim();
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      meta = {};
    }
  }

  let body = text.slice(mdMatch + MD_START.length, mdEnd).trim();
  // 若 codex 自作主張加了 frontmatter,去掉(由後端統一補上 WikiNB 格式)
  if (body.startsWith('---')) {
    const end = body.search(/\r?\n---[ \t]*\r?\n/);
    if (end !== -1) {
      body = body.slice(end).replace(/^\r?\n---[ \t]*\r?\n?/, '').trim();
    }
  }

  return {
    title: String(meta.title || '').trim(),
    slug: String(meta.slug || '').trim(),
    description: String(meta.description || '').trim(),
    tags: Array.isArray(meta.tags) ? meta.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6) : [],
    body,
  };
}

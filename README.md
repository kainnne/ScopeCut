# 收斂一下 ScopeCut

> Make it smaller. Build it completely.

把「突然想做的事情」透過 UI 選項收斂成一份完整的 **Codex Project Contract**,由本機 Codex CLI 深度規劃後,自動存進 WikiNB 筆記站的 `wiki/Projects/` 並推送上線。

網頁**不顯示規劃內容**——完成後只告訴你:文件存在本機哪裡、已推送到 GitHub、上線網址是什麼。之後把那份合約貼給任何 AI Agent(Codex CLI / Claude Code / Cursor),就能一次完成開發、測試、README 與 Git 交付。

## 核心流程

```text
登入 → 輸入這次的主要任務 → 點選範圍選項(每組都可自訂輸入)
→ 後端組裝大型工程合約 Prompt → 交給本機 Codex CLI 深度規劃
→ 產出完整 Project Contract(md)
→ 寫入 WikiNB/wiki/Projects/ + 更新 _meta.json 與 index.md 索引
→ git commit + push → GitHub Pages 上線
→ 網頁回報:本機路徑、commit、上線網址
```

## 功能

- **登入保護**:帳密登入(建議與 WikiNB Bridge 同一組),連續錯 5 次鎖 10 分鐘,session 24 小時。
- **範圍收斂選項**:時間、精神狀態、專案類型、作品形式、技術偏好、AI 使用方式、資料儲存、UI 風格、成熟度、驗收強度、GitHub 交付、參考專案——每一組都提供「自訂…」輸入管道,另有自由補充欄。
- **合約級 Prompt**:內建收斂規則(時間/精神狀態對應範圍上限)、loop engineering(測試失敗持續修正直到通過)、Definition of Done、明確不做清單。
- **Codex CLI 後台**:`codex exec`(read-only sandbox、ephemeral),模型與 reasoning effort 讀 `~/.codex/config.toml`,可用環境變數覆寫。
- **WikiNB 交付**:比照 WikiNB Bridge 的同步習慣——frontmatter、`_meta.json`、`index.md` 索引連結,git 只動 `wiki/`,不 force push。
- **進度串流**:NDJSON 即時回報各階段狀態與經過時間。
- **記住上次設定**:localStorage 保留想法與所有選項。

## 技術架構

- Node.js + Express(單一伺服器,前端靜態檔 + API)
- 前端 Vanilla JS,無 build 步驟,響應式(桌機/手機)
- Codex CLI(本機)、git(本機憑證)

## 專案結構

```text
scopecut/
├── server/
│   ├── server.js          # Express:登入、選項、產生(NDJSON 串流)
│   ├── options.js         # UI 選項定義(前後端單一來源)
│   ├── prompt-builder.js  # 合約 Prompt 組裝與 Codex 輸出解析
│   ├── codex.js           # codex exec 執行器
│   └── wikinb.js          # 寫入 wiki/Projects + meta/索引 + git push
├── public/                # 登入頁 + 主畫面(index.html / app.js / style.css)
├── test/run-tests.mjs     # 單元 + 整合測試(假 Codex,不動真實 WikiNB)
├── .env.example
└── package.json
```

## 安裝

```bash
npm install
cp .env.example .env   # 填入帳密,確認 WIKINB_ROOT 路徑
```

前置需求:已安裝並登入 Codex CLI、WikiNB 專案在本機且 git 可推送。

## 啟動

```bash
npm start              # http://localhost:8788
```

## 測試

```bash
npm test               # 15 項單元 + 整合測試(假 Codex + 暫存 wiki,不會推 git)
```

## 環境變數

| 變數 | 說明 | 預設 |
|------|------|------|
| `PORT` | 伺服器埠 | `8788` |
| `SCOPECUT_AUTH_USER` / `SCOPECUT_AUTH_PASS` | 登入帳密 | (必填) |
| `WIKINB_ROOT` | WikiNB 專案根目錄 | `/Users/kaine/Desktop/Projects/WikiNB` |
| `SCOPECUT_GIT_PUSH` | 產生後自動 commit + push | `true` |
| `CODEX_MODEL` / `CODEX_REASONING_EFFORT` | 覆寫 Codex 模型設定 | 讀 `~/.codex/config.toml` |
| `CODEX_TIMEOUT_MS` | Codex 逾時 | `900000`(15 分鐘) |
| `SCOPECUT_FAKE_CODEX` | `1` = 測試模式,不呼叫真實 Codex | (空) |

## 使用方式

1. `npm start` 後開 `http://localhost:8788`,登入。
2. 輸入你這次突然想做的事,點選(或自訂)各項範圍選項。
3. 按「幫我組成完整任務並存進 WikiNB」,等 1–5 分鐘。
4. 完成後照畫面上的路徑/網址找到合約,整段複製貼給你的 AI Agent。

## 安全原則

- `.env`、token、密碼不進 git;登入失敗鎖定;API 全部需要 Bearer token。
- git 只 staging `wiki/`,不 force push,不覆蓋既有歷史。
- Codex 以 read-only sandbox 執行,不能改動任何檔案。

## 已知限制

- 一次只能執行一個產生任務(避免同時多個 Codex 與 git 操作互踩)。
- 本工具需在本機執行(要呼叫本機 Codex CLI 與 git 憑證),不適合部署為公開網站。
- session 存在記憶體,重啟伺服器需重新登入。

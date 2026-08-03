# ScopeCut／收斂一下
## AI Agent 一小時專案生成器－完整產品規劃
> 注意！以下是我跟AI討論的md. 你可以有自由的發揮空間，在你覺得效果可能更好的情況下，你不需要完全按照以下執行，而是以完成我的專案目的為第一目標

> 將「突然想做的事情」透過 UI 選項與預先設計好的 System Prompt，包裝成一份完整、可執行、可驗收的 Codex 專案任務，讓接到網站上的 Codex CLI 生成出最適當的prompt並提供複製按鈕，以便後續完成一次貼入另一個AI agent完成規劃、開發、測試、技術文件與 GitHub 交付，所以你要設計的內容主要是一個system化的一個有loop engineering的prompt並提供複製按鈕，讓他呈現在我們製作的網站上面。你可以參考projects/WikiNB 的檔案，感受我的設計習慣跟接至codex CLI，同時注意網頁站的輸出格式為目標。本網頁需要是手機跟電腦板都能清楚瀏覽並保留我完整功能的響應式設計。

> 下面內容你可以仔細閱讀，但是他提到了很多實作的方式跟內容，你需要做的是用prompt的方式呈現，包括需要做出md.，需要部署...等等

---

# 1. 計畫目的

## 1.1 核心目的

本專案是一個自用優先的 AI Agent 工具。

它不是一般的待辦清單，也不是單純產生靈感的網站，而是要解決以下問題：

- 使用者常常突然想到很多想做的事情。
- 一個原本只想花一小時完成的想法，容易不斷擴充。
- 使用者雖然會使用 Codex CLI、Claude Code 或 Cursor，但每次都要重新整理需求、限制範圍與驗收條件。
- AI Agent 若沒有被明確限制，容易自行增加架構、功能或未來規劃。
- 最後可能得到一堆半成品，而不是可以直接展示、執行與封存的完整小作品。

本專案要把這個流程標準化：

```text
使用者在 UI 點選選項
→ 系統將選項與固定規則組成完整 Prompt
→ 將 Prompt 交給 Codex CLI
→ Codex 規劃並直接執行
→ 持續測試與修正
→ 產生可直接展示的網站或程式
→ 撰寫 README.md
→ 建立 Git commit
→ 推送至 GitHub
→ 任務完成並封存
```

## 1.2 最終成果

每次使用本工具，應產生一個：

- 範圍明確
- 符合使用者可投入時間
- 功能完整
- 可以直接執行
- 可以直接展示
- 已完成測試
- 包含 README.md
- 已整理 Git commit
- 可推送或已推送至 GitHub

的小型完整專案。

## 1.3 使用情境

本工具主要適合：

- 上班疲累時想轉換心情
- 想做一個「廢廢但有趣」的小網站
- 想練習 UI、Prompt、Agent 或程式設計
- 想建立一個一小時內可完成的 side project
- 想快速驗證一個產品概念
- 想做一個可以直接分享給朋友的工具
- 不想花時間重新寫開發規格
- 不想讓 AI Agent 無限擴充需求

---

# 2. 產品定位

## 2.1 一句話定位

> 用 UI 選項把一個想法包裝成完整的 Codex Agent Contract，讓 AI 在限制時間與範圍內一步到位完成可展示的專案。

## 2.2 產品名稱

- 中文：**收斂一下**
- 英文：**ScopeCut**
- 副標題：**One-hour AI project builder**
- 標語：**Make it smaller. Build it completely.**

## 2.3 非目標

本專案第一版不做：

- 廣告
- 商業化
- 會員系統
- 訂閱
- 付款
- 公開作品社群
- 排行榜
- 團隊協作
- 多使用者權限
- 大型專案管理
- 長期 Roadmap 管理
- 雲端 Codex 帳戶代管
- 大量 API 用量管理
- 手機 App

---

# 3. 核心產品概念

## 3.1 不是讓 LLM 自由發揮

本工具不應只有一個大型輸入框，再讓 LLM 自己猜使用者需要什麼。

核心做法是：

- 先設計好一套穩定的選項。
- 讓使用者透過 UI 選擇。
- 將選項轉換成結構化資料。
- 由 System Prompt 將資料包裝成完整的專案規格。
- 最後交由 Codex CLI 執行。

這樣可以：

- 降低 Prompt 品質不穩定
- 限制專案範圍
- 減少 Codex 自行腦補
- 提高一次完成率
- 提高不同任務之間的一致性
- 讓疲累時也可以快速開始

## 3.2 兩層 AI 流程

### 第一層：規格生成器

負責將 UI 選項轉成：

- 專案定位
- 功能範圍
- 技術選型
- UI 需求
- 驗收標準
- 測試規則
- README 要求
- GitHub 交付規則
- 禁止事項
- Codex Agent Contract

### 第二層：Codex CLI 執行器

負責：

- 檢查工作目錄
- 閱讀既有專案
- 建立執行計畫
- 建立或修改程式
- 執行測試
- 自行除錯
- 重複測試直到通過
- 撰寫 README.md
- 建立 Git commit
- 在允許時推送至 GitHub
- 輸出完成摘要

---

# 4. 建議產品形態

## 4.1 第一版建議：本機 Web App

第一版建議做成在本機執行的 Web App，例如：

```text
http://localhost:4321
```

原因：

- 一般公開網站不能直接控制使用者電腦上的 Codex CLI。
- 瀏覽器本身不能任意執行 Terminal 指令。
- 若要直接呼叫本機 Codex CLI，需要本機後端或 Local Bridge。
- 自用工具不需要先處理複雜的雲端帳戶與權限問題。

## 4.2 架構

```text
Astro／React UI
        ↓
Local Node.js API
        ↓
Prompt Builder
        ↓
Codex CLI Adapter
        ↓
本機專案資料夾
        ↓
Git／GitHub CLI
```

## 4.3 兩種操作模式

### 模式 A：只產生 Prompt

- 系統產生完整 Prompt。
- 使用者複製後手動貼到 Codex CLI。
- 技術風險最低。
- 適合 MVP。

### 模式 B：直接執行 Codex CLI

- Local API 將 Prompt 傳給 Codex CLI。
- 顯示執行狀態與結果。
- 需要安全地限制可操作路徑。
- 適合第二階段。

第一版應先確保「Prompt 生成品質」足夠高，再加入自動執行。

---

# 5. 使用者流程

## 5.1 Step 1：輸入原始想法

自由輸入，例如：

```text
我想做一個很廢但有用的網站，
輸入今天的精神狀態後，產生一個適合今天做的小任務。
```

## 5.2 Step 2：點選專案選項

使用者不需要自行撰寫完整規格，只需要選擇：

- 可投入時間
- 專案類型
- 使用目的
- 技術形式
- UI 風格
- 資料儲存方式
- AI 使用方式
- 完成標準
- GitHub 交付方式
- 允許的複雜度
- 是否參考既有專案
- 是否直接執行 Codex

## 5.3 Step 3：預覽 Project Contract

系統顯示：

- 一句話專案目標
- 本次要完成的功能
- 本次禁止功能
- 預估工作範圍
- 最終輸出
- Codex 執行方式

使用者可以：

- 直接執行
- 複製 Prompt
- 下載 Markdown
- 修改少量細節

## 5.4 Step 4：Codex 開發

Codex 必須：

1. 檢查目前資料夾與既有檔案。
2. 若為新專案，建立最小且合理的架構。
3. 若為既有專案，先閱讀 README、package.json 與主要程式。
4. 建立簡短內部計畫。
5. 直接實作，不只提供建議。
6. 執行測試與 build。
7. 發現錯誤時自行修正。
8. 重複測試直到所有驗收條件成立。
9. 撰寫 README.md。
10. 建立 Git commit。
11. 若使用者選擇自動推送，推送至指定 GitHub repository。
12. 提供完成摘要。

## 5.5 Step 5：封存

專案完成後：

- 儲存 Project Contract
- 儲存 Codex 最終摘要
- 顯示 repository 位置
- 標記 Completed
- 不主動提出下一階段功能

---

# 6. UI 選項設計

---

## 6.1 原始想法

### 類型

- 自由輸入文字
- 最多 1,000 字
- 可貼入零散筆記
- 可以只有一句話

### Placeholder

```text
例如：我想做一個輸入心情後，
幫我挑一個一小時內可以完成的小網站。
```

---

## 6.2 可投入時間

單選：

- 15 分鐘
- 30 分鐘
- 45 分鐘
- 60 分鐘
- 90 分鐘
- 半天
- 自訂

### 預設規則

- 15 分鐘：單一靜態頁面或單一腳本
- 30 分鐘：一個核心互動
- 45 分鐘：一個完整單頁工具
- 60 分鐘：完整小型網站或程式
- 90 分鐘：可加入基本儲存或簡單 API
- 半天：可包含部署、測試與較完整文件

---

## 6.3 目前精神狀態

單選：

- 腦袋已死
- 有點累
- 普通
- 很有精神
- 今天想挑戰

### 對應規則

#### 腦袋已死

- 優先選擇現成框架
- 不要求複雜決策
- 功能最多 2 個
- 不做後端
- 不做資料庫
- 不做複雜狀態管理

#### 有點累

- 功能最多 3 個
- 優先單頁
- 可以使用 localStorage
- 使用成熟套件

#### 普通

- 功能最多 4 個
- 可使用一個簡單 API
- 可增加基本測試

#### 很有精神

- 功能最多 5 個
- 可加入 serverless function
- 可做稍完整 UI

#### 今天想挑戰

- 仍需符合時間限制
- 可以使用一項不熟悉技術
- 不得因此擴充專案範圍

---

## 6.4 專案類型

可複選，但最多選兩個：

- 實用小工具
- 廢廢有趣網站
- AI Prompt 工具
- 互動文字作品
- 教育工具
- 資料視覺化
- 音樂工具
- 創作工具
- 開發者工具
- 文件生成器
- 個人效率工具
- 隨機決定

---

## 6.5 最終作品形式

單選：

- 靜態網站
- 單頁 Web App
- 本機 Web App
- CLI 工具
- Python 腳本
- Node.js 工具
- Browser Extension
- Markdown 產生器
- 小型 API
- Unity Prototype
- 由 AI 根據時間決定

### Unity 限制

若選擇 Unity：

- 必須與康橋、數位教學或正式專案有合理關聯
- 或僅產生架構、資料與文字介面
- 上班環境不直接顯示明顯遊戲畫面
- 不製作大型 3D 場景
- 不加入複雜資產流程

---

## 6.6 技術偏好

可複選：

- Astro
- React
- Next.js
- Vue
- Vanilla TypeScript
- Python
- Node.js
- Tailwind CSS
- SQLite
- localStorage
- 不指定，交給 Codex 決定

### 預設偏好

若使用者未指定：

- 靜態網站：Astro + TypeScript + Tailwind
- 單頁工具：React 或 Astro Islands
- 本機工具：Node.js + Web UI
- 資料處理：Python
- 儲存：優先 localStorage
- 後端：能不做就不做

---

## 6.7 AI 使用方式

單選：

- 完全不使用 LLM
- 使用固定規則
- 使用 OpenAI API
- 使用 Gemini API
- 使用其他 API
- 只由 Codex 生成內容
- 先保留介面，不接 API
- 由 Codex 根據成本決定

### 規則

- API key 不得寫入前端
- 必須使用環境變數
- 必須提供 `.env.example`
- README 必須說明設定方法
- 若沒有 API key，應有 fallback 或 mock mode
- 不為了使用 AI 而強行加入 AI

---

## 6.8 UI 風格

單選：

- 極簡正式
- 溫和療癒
- 深色工程感
- 編輯器風格
- Notion／文件風格
- 卡片式產品介面
- 有點嘴但仍專業
- 康橋／教育工具風格
- 參考 WikiNB
- 由 Codex 決定

### 共通要求

- Responsive
- 桌面優先但手機可用
- 不使用過度動畫
- 不像廉價遊戲網站
- 主流程一眼看懂
- 按鈕與輸入框要有完整狀態
- 錯誤訊息必須清楚

---

## 6.9 資料儲存

單選：

- 不儲存
- localStorage
- JSON 檔
- SQLite
- Serverless Database
- 由 Codex 決定

### 預設原則

- 一小時任務優先 localStorage
- 沒有明確需求不使用資料庫
- 不建立帳號與權限系統
- 不為未來擴充預留複雜 Schema

---

## 6.10 專案成熟度

單選：

- 快速 Prototype
- 可以分享給朋友
- 可以放作品集
- 可以作為正式內部工具
- 可以作為康橋 Demo

### 差異

#### 快速 Prototype

- 核心流程可用即可
- 基本 README
- 基本錯誤處理

#### 可以分享給朋友

- UI 完整
- 不需要技術背景即可使用
- 有明確操作說明
- 基本測試通過

#### 可以放作品集

- 視覺一致
- README 完整
- 有架構說明
- 有截圖位置
- 有部署說明

#### 正式內部工具

- 輸入驗證
- 錯誤處理
- 基本安全限制
- 清楚的技術文件

#### 康橋 Demo

- 文案與畫面得體
- 不顯示不適合辦公環境的遊戲畫面
- 可連結 AI 教育、數位教學或正式工作
- README 補上教育應用說明

---

## 6.11 驗收強度

單選：

- 基本可用
- Build 必須通過
- 核心流程測試
- 完整自動測試
- Codex 自行決定合理測試

### 預設

至少要求：

- 安裝成功
- Build 成功
- Lint 或 Type Check 通過
- 核心流程可執行
- 無明顯 Console Error
- README 指令可用

---

## 6.12 GitHub 交付

單選：

- 不使用 Git
- 只建立本地 Git commit
- Push 到既有 repository
- 建立新的 private repository
- 建立新的 public repository
- 只產生 Git 指令，由使用者手動執行

### 必要欄位

若選擇推送：

- Repository 名稱
- Public／Private
- GitHub owner
- 是否允許 Codex 執行 push
- Commit message

### 安全原則

- 不得自行推送到未確認的 repository
- 不得 force push
- 不得覆蓋 main 的既有歷史
- 若 remote 已存在，先檢查狀態
- 發現未提交變更時，先保護使用者資料
- 不得提交 `.env`、token 或憑證

---

## 6.13 參考既有專案

複選：

- 不參考
- 參考 `projects/WikiNB`
- 參考目前工作目錄
- 參考指定路徑
- 只參考 UI
- 只參考資料結構
- 只參考 README
- 只參考部署方式

### WikiNB 參考規則

若選擇參考 `projects/WikiNB`，Prompt 應告知 Codex：

- 使用者以前做過類似的頁面與產品設計。
- 可以先檢查 `projects/WikiNB` 或使用者指定的 WikiNB repository。
- 可參考其：
  - Astro／Tailwind 使用方式
  - 頁面資訊層級
  - 卡片與文件式 UI
  - Responsive 設計
  - README 結構
  - GitHub Pages／Actions 部署方式
- 不得直接複製不相關的業務邏輯。
- 不得修改原始 WikiNB 專案。
- 只把它當作視覺與工程習慣參考。
- 若路徑不存在，跳過並在完成摘要中說明。

---

## 6.14 Codex 執行模式

單選：

- 只產生完整 Prompt
- 產生 Prompt 並複製
- 在指定資料夾直接執行
- 建立新資料夾後執行
- 執行後等待使用者手動 Git push
- 執行並自動 Git push

---

# 7. Prompt 組裝系統

## 7.1 結構

最終交給 Codex 的 Prompt 應由以下區塊組成：

```text
1. System Role
2. Project Intent
3. User Idea
4. Time and Scope Constraints
5. Selected Technical Options
6. UI Requirements
7. Reference Project Instructions
8. Functional Requirements
9. Non-Goals
10. Testing and Quality Gates
11. README Requirements
12. Git and GitHub Requirements
13. Definition of Done
14. Final Response Format
```

## 7.2 結構化資料範例

```json
{
  "idea": "做一個讓使用者輸入暴走點子後，產生一小時任務的網站",
  "time_budget": 60,
  "energy": "tired",
  "project_types": ["utility", "fun"],
  "output_type": "single_page_web_app",
  "tech_preferences": ["Astro", "TypeScript", "Tailwind"],
  "ai_mode": "OpenAI API",
  "storage": "localStorage",
  "ui_style": "document_product",
  "maturity": "share_with_friends",
  "test_level": "core_flow",
  "github_mode": "push_existing_repo",
  "reference_projects": ["projects/WikiNB"],
  "execution_mode": "run_codex"
}
```

---

# 8. System Prompt 草案

```md
# Role

你是一位資深 AI Product Engineer、Full-stack Developer、QA Engineer 與 Technical Writer。

你的任務不是只提供建議，而是在目前工作目錄中，完成一個符合使用者限制、可直接執行、可直接展示、已完成測試與技術文件的小型專案。

# Core Behavior

- 先檢查目前資料夾與既有檔案。
- 若有既有程式，先理解後再修改。
- 若為新專案，使用最小且合理的架構。
- 不得增加使用者未要求的功能。
- 不得主動建立 Roadmap。
- 不得為不確定的未來需求過度抽象化。
- 優先完成核心功能，而不是討論更多可能性。
- 遇到錯誤時，必須自行分析、修正並重新測試。
- 不要在第一次錯誤後停止。
- 持續執行必要測試，直到所有合理的驗收條件通過。
- 若某項需求因環境限制無法完成，應完成其餘部分，並清楚記錄限制。
- 不得刪除或覆蓋使用者既有的重要資料。
- 不得提交任何 API key、密碼、token 或 `.env`。

# One-pass Delivery Goal

盡可能在一次任務中完成：

1. 專案規劃
2. 程式實作
3. UI 完成
4. 輸入驗證
5. 錯誤處理
6. 測試
7. Build
8. README.md
9. Git commit
10. GitHub push（僅在明確允許時）
11. 完成摘要

# Scope Control

專案必須符合使用者設定的時間成本。

- 只保留最核心、最可展示的功能。
- 若需求過大，主動縮小實作範圍，但保留核心價值。
- 不加入會員、付款、社群、多人、後台或資料庫，除非使用者明確選擇。
- 不加入與核心體驗無關的動畫或架構。
- 完成後停止，不提供下一階段功能建議。

# Testing Requirement

完成實作後必須：

- 安裝依賴
- 執行 Type Check 或等價檢查
- 執行 Lint（若專案已有）
- 執行測試（若合理）
- 執行 Build
- 驗證核心使用流程
- 檢查明顯 Console Error
- 發現問題時修正並重新執行

必須持續修正，直到：

- 所有可執行檢查通過
- 核心流程符合需求
- 專案可以依 README 指令啟動

# README Requirement

README.md 至少包含：

- 專案名稱
- 專案目的
- 核心功能
- 技術架構
- 專案結構
- 安裝方式
- 本機啟動
- Build
- 測試
- 環境變數
- 部署方式
- 使用說明
- 已知限制

# Reference Project

若使用者指定參考 `projects/WikiNB`：

- 先確認路徑是否存在。
- 僅參考其 UI、檔案組織、README 與部署習慣。
- 不修改 WikiNB。
- 不複製不相關的功能。
- 若不存在，直接繼續，不要停止整個任務。

# Git Requirement

若使用者允許 Git：

- 執行 `git status`
- 保留既有未提交內容
- 不使用 force push
- 不提交秘密資訊
- 使用清楚的 commit message
- Push 前確認 remote 與 branch
- 僅推送到使用者指定的 repository

# Final Response

最終只需提供：

- 完成了什麼
- 主要檔案
- 測試與 Build 結果
- 啟動方式
- Git commit／push 結果
- 尚未完成或受限之處

不要主動提供 Roadmap 或下一階段建議。
```

---

# 9. 最終 Codex Prompt 模板

```md
# Project Task

請在目前工作目錄完成以下專案。

## 專案想法

{{USER_IDEA}}

## 一句話目標

{{ONE_SENTENCE_GOAL}}

## 時間成本

- 使用者可投入時間：{{TIME_BUDGET}}
- 使用者目前精神狀態：{{ENERGY_LEVEL}}
- 請將實作範圍控制在此成本內。

## 專案形式

- 類型：{{PROJECT_TYPES}}
- 最終形式：{{OUTPUT_TYPE}}
- 成熟度：{{MATURITY_LEVEL}}

## 技術偏好

{{TECH_PREFERENCES}}

若未指定，請使用最小、成熟且容易維護的技術。

## AI 使用方式

{{AI_MODE}}

## 資料儲存

{{STORAGE_MODE}}

## UI 要求

- 風格：{{UI_STYLE}}
- 必須 responsive。
- 主流程必須一眼可理解。
- 輸入、Loading、Success、Error 與 Empty State 必須完整。
- 不使用妨礙操作的過度動畫。

## 參考專案

{{REFERENCE_PROJECT_INSTRUCTIONS}}

## 必須完成

{{MUST_HAVE_FEATURES}}

## 明確不做

{{NON_GOALS}}

## 開發要求

- 請先檢查目前資料夾。
- 直接實作，不要只提供教學。
- 使用最小且合理的架構。
- 不得增加未要求功能。
- 不得建立未來 Roadmap。
- 不得過度抽象化。
- 遇到錯誤時自行修正。
- 請不斷測試功能正確性，直到完成所有需求。
- 最終專案必須可以直接啟動並呈現結果。

## 測試與驗收

{{TEST_REQUIREMENTS}}

至少完成：

- 依賴安裝
- Type Check 或等價檢查
- Build
- 核心流程驗證
- 必要的錯誤修正
- README 指令驗證

## README.md

請撰寫完整 README.md 作為技術文件，至少包含：

- 專案目的
- 功能
- 技術架構
- 專案結構
- 安裝
- 啟動
- Build
- 測試
- 環境變數
- 部署
- 使用方式
- 已知限制

## Git 與 GitHub

{{GIT_GITHUB_INSTRUCTIONS}}

若允許 Push：

- 確認 remote 與 branch
- 不得 force push
- 不得提交秘密資訊
- 建立清楚的 commit
- 一併 push 到指定 GitHub repository

## Definition of Done

只有在以下條件成立時才算完成：

{{DEFINITION_OF_DONE}}

完成後停止修改，不要提出額外功能或下一階段 Roadmap。
```

---

# 10. Definition of Done 產生規則

系統應依使用者選項自動產生可檢查的完成條件。

範例：

```md
## Definition of Done

- 首頁可以正常開啟。
- 使用者可以輸入一個專案想法。
- 使用者可以選擇時間、精神狀態與專案類型。
- 點擊產生後，畫面顯示完整 Project Contract。
- Project Contract 可以複製。
- Project Contract 可以下載為 Markdown。
- localStorage 可以保留最後一次設定。
- 無 API key 時顯示清楚的設定提示。
- Type Check 通過。
- Build 通過。
- README.md 完整。
- 專案已建立 Git commit。
- 若允許 Push，程式已推送至指定 GitHub repository。
```

---

# 11. 專案自身的 MVP

## 11.1 第一版必做

- 一個單頁 UI
- 原始想法輸入
- 所有核心選項
- Prompt Preview
- 產生完整 Codex Prompt
- 複製 Prompt
- 下載 `.md`
- 儲存最近一次設定
- WikiNB 參考選項
- GitHub 交付選項
- 清楚的 System Prompt
- README.md

## 11.2 第一版可選

- Prompt 歷史紀錄
- 內建 10 個範例點子
- 自動產生專案名稱
- 深色模式
- Local Codex Bridge

## 11.3 第一版禁止

- 登入
- 雲端資料庫
- 社群
- 廣告
- 付費
- 多人協作
- Agent Marketplace
- 自動部署大量專案
- 同時執行多個 Codex 任務
- 複雜工作流編輯器

---

# 12. Local Codex Bridge 規劃

## 12.1 目的

讓使用者可以在 UI 中點擊：

> 直接交給 Codex

由本機後端：

- 建立或選擇專案資料夾
- 寫入 Project Contract
- 呼叫本機 Codex CLI
- 顯示執行日誌
- 回傳完成狀態

## 12.2 安全限制

- 只能操作使用者設定的 workspace 根目錄
- 不接受任意系統路徑
- 執行前顯示目標資料夾
- 執行 Git push 前再次檢查選項
- 不顯示或記錄 API token
- 日誌須隱藏敏感資訊
- 不允許刪除 workspace 以外內容
- 同時只執行一個任務

## 12.3 建議資料夾

```text
~/Projects/ScopeCut-Generated/
```

每次產生：

```text
~/Projects/ScopeCut-Generated/
└── 2026-08-03-project-name/
    ├── PROJECT_CONTRACT.md
    ├── README.md
    └── ...
```

---

# 13. 建議 Repository 結構

```text
scopecut/
├── README.md
├── package.json
├── astro.config.mjs
├── src/
│   ├── components/
│   │   ├── IdeaInput.astro
│   │   ├── OptionGroup.astro
│   │   ├── PromptPreview.astro
│   │   ├── ProjectSummary.astro
│   │   └── ExecutionPanel.astro
│   ├── config/
│   │   ├── options.ts
│   │   └── defaults.ts
│   ├── lib/
│   │   ├── prompt-builder.ts
│   │   ├── contract-builder.ts
│   │   ├── markdown-export.ts
│   │   ├── storage.ts
│   │   └── validation.ts
│   ├── prompts/
│   │   ├── system.md
│   │   ├── codex-project.md
│   │   ├── testing.md
│   │   ├── github.md
│   │   └── wikinb-reference.md
│   ├── pages/
│   │   ├── index.astro
│   │   └── api/
│   │       └── execute.ts
│   ├── types/
│   │   └── project.ts
│   └── styles/
│       └── global.css
├── local-bridge/
│   ├── server.ts
│   ├── codex-adapter.ts
│   ├── git-adapter.ts
│   └── workspace-guard.ts
├── public/
└── docs/
    ├── PRODUCT_SPEC.md
    ├── PROMPT_ARCHITECTURE.md
    └── SECURITY.md
```

---

# 14. 資料型別建議

```ts
export interface ProjectConfig {
  idea: string;
  timeBudget: 15 | 30 | 45 | 60 | 90 | 240;
  energyLevel:
    | "exhausted"
    | "tired"
    | "normal"
    | "energetic"
    | "challenge";
  projectTypes: string[];
  outputType: string;
  techPreferences: string[];
  aiMode: string;
  storageMode: string;
  uiStyle: string;
  maturityLevel: string;
  testLevel: string;
  githubMode: string;
  referenceProjects: string[];
  executionMode: string;
  customRequirements: string;
}
```

---

# 15. UI 文案建議

## 首頁

### 標題

> 收斂一下

### 副標題

> 把突然想做的事情，包裝成 Codex 一次能完成的完整專案。

### 輸入區

> 你現在突然想做什麼？

### 主要按鈕

> 幫我組成完整任務

### Prompt 預覽按鈕

> 看看 Codex 會收到什麼

### 執行按鈕

> 直接交給 Codex

### 完成提示

> 做到這裡就停。這已經是一個完整作品。

---

# 16. 驗收標準

## 16.1 Prompt 生成

- 所有 UI 選項都能正確反映在 Prompt。
- Prompt 不互相矛盾。
- Prompt 明確包含時間限制。
- Prompt 明確包含禁止事項。
- Prompt 明確要求測試與修正。
- Prompt 明確要求 README。
- Prompt 明確要求 Git／GitHub 行為。
- Prompt 明確說明 WikiNB 參考方式。
- Prompt 可以單獨複製並交給 Codex 使用。

## 16.2 UI

- 不需閱讀說明即可完成設定。
- 選項不過度冗長。
- 可以快速使用預設值。
- 疲累時最多一到兩分鐘即可產生 Prompt。
- 桌面與手機皆可操作。
- Prompt 區可複製與下載。
- 錯誤狀態清楚。

## 16.3 Local Bridge

- 只能在允許的 workspace 操作。
- 可以建立新專案資料夾。
- 可以將 Prompt 寫入 Markdown。
- 可以呼叫 Codex CLI。
- 可以顯示基本狀態。
- Codex 失敗時有清楚錯誤。
- Git push 不會自動覆蓋既有專案。
- 敏感資訊不寫入 repository。

---

# 17. 最重要的設計原則

- UI 選項是用來降低思考成本，不是增加設定負擔。
- Prompt 必須比一般聊天指令更完整、更像正式工程合約。
- Codex 的任務是直接完成，不只是規劃。
- 每個專案都應有清楚的 Definition of Done。
- 測試失敗時，Codex 應持續修正，不應立即停止。
- README.md 是每個專案的必要交付成果。
- GitHub 是作品封存與分享方式，不是專案管理負擔。
- WikiNB 可以作為使用者既有設計能力與工程習慣的參考。
- 不要讓此工具自己變成一個過度龐大的 SaaS。
- 第一版最重要的是：**產生真的好用、可以一步到位交給 Codex 的 Prompt。**

---

# 18. 最終成功標準

這個計畫成功，不是因為它有多少功能。

而是使用者可以在疲累時：

1. 輸入一個突然想到的點子。
2. 點選幾個簡單選項。
3. 得到一份完整且嚴謹的 Codex Project Contract。
4. 讓 Codex 一次完成規劃、開發、測試、README 與 GitHub 交付。
5. 最後得到一個可以直接打開、展示與分享的小作品。

> 點子不需要變成長期負擔。  
> 它可以在一小時內，變成一個完成品。

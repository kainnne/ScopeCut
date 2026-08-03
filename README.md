# ScopeCut

> Design by Kainnne

把「突然想做的事情」透過分步 UI 選項收斂成完整 **Codex Project Contract**,由本機 Codex CLI(唯讀 sandbox)規劃後,自動存進 WikiNB `wiki/Projects/` 並推送上線。

## 連結

- **GitHub Pages:** [https://zx50416.github.io/ScopeCut/](https://zx50416.github.io/ScopeCut/)
- **本機 Bridge:** [http://localhost:8788](http://localhost:8788)(產生合約 / Codex / 推送必須本機執行)
- **交付目的地:** [WikiNB](https://zx50416.github.io/WikiNB/) → `wiki/Projects/`
- **原始碼:** [https://github.com/zx50416/ScopeCut](https://github.com/zx50416/ScopeCut)

> Pages 只託管粉色 UI。實際呼叫 Codex、寫檔、git push 都走本機 Bridge(`npm start`)。從 Pages 開啟時會自動連 `http://localhost:8788`。

## 核心流程

```text
登入(帳密 → 驗證碼信)
→ 想法 → 可投入時間 → 精神狀態 → …(每步選完自動跳轉)
→ 確認 → Codex 唯讀規劃 → 寫入 WikiNB/wiki/Projects/ → push
→ 回報本機路徑與上線網址
```

## 安全

- **Codex 永遠 `--sandbox read-only --ephemeral`**:只能輸出文字合約,不能建立/修改/刪除本機檔案。
- 寫入 `wiki/Projects/` 與 git push 僅由 ScopeCut 後端執行。
- 登入為兩步驟(帳密 + 六位數 OTP),連續錯碼會鎖定;沿用 WikiNB 的 SMTP 設定。

## 啟動

```bash
npm install
cp .env.example .env   # 帳密 / SMTP 可直接沿用 WikiNB bridge/.env
npm start              # http://localhost:8788
```

## 測試

```bash
npm test
```

## 環境變數

見 `.env.example`。重點:

| 變數 | 說明 |
|------|------|
| `SCOPECUT_AUTH_USER` / `SCOPECUT_AUTH_PASS` | 登入帳密 |
| `SCOPECUT_AUTH_EMAILS` | 驗證碼收件 |
| `SMTP_*` | 與 WikiNB 同一組 Gmail 應用程式密碼 |
| `WIKINB_ROOT` | WikiNB 本機路徑 |
| `CORS_ORIGINS` | 允許 Pages 呼叫本機 Bridge |
| `SCOPECUT_GIT_PUSH` | 產生後自動 push |

## 專案結構

```text
public/          # GitHub Pages 靜態 UI(粉色分步精靈)
server/          # 本機 Bridge(OTP、Codex read-only、WikiNB 寫入)
.github/workflows/deploy-pages.yml
```

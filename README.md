# ScopeCut

ScopeCut 把還很模糊的專案想法，整理成可開始的方向、第一版範圍、學習清單，以及一份能直接交給 AI Agent 的簡短 Prompt。

- 網站：[https://scopecut.kainnne.com](https://scopecut.kainnne.com)
- Kainnne：[https://kainnne.com](https://kainnne.com)
- 原始碼：[https://github.com/kainnne/ScopeCut](https://github.com/kainnne/ScopeCut)

## 公開前端

目前公開版是用來驗證產品流程的前端 MVP，包含：

1. 不用先註冊，先完成五步想法整理。
2. 草稿保存在瀏覽器，進入登入畫面後不會消失。
3. 以 Email 免密碼登入介面呈現預計流程。
4. 產生包含三個以內方向、主推薦、第一版、學習知識與 Agent Prompt 的 Scope Pack 範例。
5. 每日 2 點與 US$1／3／5 點數方案的介面預覽。
6. 深淺色模式、手機版與 reduced-motion 支援。

前端會清楚標示預覽狀態；目前不會真的寄送 Email、不會呼叫付費 AI，也不會建立付款或扣款。每日點數與 Scope Pack 內容暫時由瀏覽器端模擬。

## 本機預覽

```bash
npm install
npm start
```

開啟 [http://localhost:8788](http://localhost:8788)。

也可以只預覽 GitHub Pages 會發布的靜態內容：

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
```

## 測試

```bash
npm test
node --check public/app.js
```

## 舊版本機 Bridge

`server/` 仍保留原有的 OTP、Codex 唯讀規劃與 WikiNB 寫入流程，供本機開發與既有測試使用。新版公開前端不會連線到這個 Bridge，也不會從瀏覽器觸發本機 Codex、Git 或 WikiNB 操作。

## 部署

`.github/workflows/deploy-pages.yml` 會在 `main` 更新時，把 `public/` 發布至 GitHub Pages 與 ScopeCut 自訂網域。

## 結構

```text
public/                    # 公開前端 MVP
server/                    # 舊版本機 Bridge
test/                      # Bridge 單元與整合測試
.github/workflows/        # GitHub Pages 部署
```

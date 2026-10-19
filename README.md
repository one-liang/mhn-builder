# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 資料同步

`data/` 的技能、漂流石、防具與武器資料來自官方網站 [monsterhunternow.com](https://monsterhunternow.com)，由 `scripts/sync/`（零依賴 Node 20+ 腳本）重新抓取並改寫。

```bash
npm run sync:data -- --dry-run --report /tmp/sync-report.md   # 只比對，不寫檔；報告寫到 /tmp/sync-report.md
npm run sync:data                                             # 寫入 data/、下載新圖片到 public/images/
npm run sync:data -- --help                                   # 其他選項（--cache-dir、--allow-shrink、--skip-images…）
npm run validate:data                                         # 檢查 data/ 與圖片
```

- 同步會先在暫存目錄驗證結果，任何錯誤（官方網站改版、筆數驟減、驗證失敗）都會中止且不修改 `data/`。
- ID 會寫進分享網址與瀏覽器存檔，永不更名或刪除：官方不再列出的紀錄會保留並列在報告中；新 ID 依預設規則產生並追加到 `scripts/sync/config/id-maps.json`，需人工確認。
- 官方資料有誤時，在 `scripts/sync/config/overrides.json` 寫入覆寫值，不要直接改 `data/`。
- 使用 `--skip-images` 時不下載新圖片，之後 `npm run validate:data` 會回報缺圖，直到不加此參數重新執行。

### 每週自動同步（GitHub Actions）

`.github/workflows/sync-data.yml` 每週一 09:23（台北時間）執行，也可在 Actions 頁手動執行：同步 → `validate:data` → `npm run generate` 建置測試 → 開啟或更新 `chore/data-sync` → `main` 的 PR，PR 內容就是同步報告。它不會直接推送到 `main`，合併 PR 後才會觸發 `deploy.yml` 部署。

- 需要在 Settings → Actions → General → Workflow permissions 勾選「Allow GitHub Actions to create and approve pull requests」。
- 同步失敗時該次執行會失敗（GitHub 會寄信通知），不會開 PR。
- 每次執行都會從 `main` 重建 `chore/data-sync` 並強制推送，所以**不要直接在這個分支上提交**。技能說明等手動修改請先合併 PR，再提交到 `main`；PR 裡才出現的新技能，也可以在 `main` 的 `scripts/sync/config/overrides.json` 寫入 `description`。如果開著的 PR 已有手動提交，workflow 會失敗且不更新 PR，以免捨棄這些提交。這時請合併該 PR（或把提交移到 `main`）後重新執行；確定要捨棄的話，關閉 PR 後重新執行。
- 公開 repo 60 天沒有活動時，GitHub 會暫停排程，需到 Actions 頁重新啟用。

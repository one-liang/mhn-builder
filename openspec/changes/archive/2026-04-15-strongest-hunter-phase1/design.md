## Context

「最強獵人」是一個 Monster Hunter Now (MHN) 配裝模擬器網站，以繁體中文為主、手機操作為核心。專案使用 Nuxt 4 + shadcn-vue + Tailwind CSS + Pinia 技術棧。Phase 1 的目標是建立資料基礎與 UI 骨架，讓使用者可以瀏覽所有裝備資料。

現有專案已有基礎 Nuxt 4 設定、shadcn-vue 整合、Tailwind CSS 4 配置，但沒有任何頁面、元件或資料。

競品分析顯示 mhnow.me 和 mhn.quest 都不是 mobile-first 設計，UI 偏向功能堆疊，缺乏遊戲沉浸感。

## Goals / Non-Goals

**Goals:**

- 建立完整的 MHN 裝備 JSON 資料系統，涵蓋所有武器、防具、技能、漂流石（15 種 A~O）、素材
- 建立 mobile-first、魔物獵人遊戲風格的 UI 設計系統
- 實作裝備資料庫瀏覽功能，每個裝備/技能/漂流石都有獨立 SEO 頁面
- 建立 Pinia Store 管理裝備資料的載入與存取
- 預設顯示滿級裝備資料

**Non-Goals:**

- 手動配裝功能（Phase 2）
- 自動配裝演算法（Phase 3）
- 我的倉庫系統（Phase 4）
- 廣告整合（Phase 5）
- 社群功能、帳號系統（Phase 6）
- 多語言支援（未來）
- 後端 API 服務（Phase 1 使用靜態 JSON）

## Decisions

### Decision 1: 靜態 JSON 檔案作為資料來源

**選擇**: 在 `/data` 目錄下建立靜態 JSON 檔案，透過 Nuxt 的 `server/api` 或直接 import 提供資料。

**替代方案**:
- SQLite + Nitro API：增加複雜度，Phase 1 不需要
- 外部 API（如 mhw-db.com）：MHN 沒有對應的公開 API
- Nuxt Content：適合 Markdown 內容，但裝備資料更適合結構化 JSON

**理由**: MHN 裝備數量有限（約 30~50 套防具、10+ 種武器類型），靜態 JSON 足以應對。更新時只需修改 JSON 檔並重新部署。未來有需要時再遷移到 CMS 或資料庫。

### Decision 2: JSON Schema 設計 — 按類型分檔

**選擇**:
```
/data
├── weapons/
│   ├── great-sword.json
│   ├── long-sword.json
│   └── ...（按武器類型分檔）
├── armor/
│   ├── head.json
│   ├── chest.json
│   ├── arms.json
│   ├── waist.json
│   └── legs.json
├── skills.json
├── driftstones.json
└── materials.json
```

**理由**: 按類型分檔便於維護和按需載入，避免單一大檔案。武器按類型分是因為不同武器類型的資料結構略有差異。防具按部位分是因為配裝時按部位選擇。

### Decision 3: Mobile-first + 遊戲風格 UI

**選擇**: 使用 Tailwind CSS 自定義遊戲風格主題，搭配 shadcn-vue 元件，底部 Tab 導航。

**色系**:
- Primary: 琥珀金 `#D4A017`（MH 標誌色）
- Background: 深棕 `#1A1410`（皮革質感）
- Surface: `#2D1B10`（卡片背景）
- Accent: 深紅 `#8B2500`（強調色）
- Text: 米白 `#F5F0E0`（羊皮紙色）

**底部導航 Tab**:
1. 防具（Armor）
2. 武器（Weapons）
3. 技能（Skills）
4. 漂流石（Driftstones）

**理由**: MHN 本身是手機遊戲，使用者幾乎都是手機用戶。遊戲風格 UI 增加沉浸感，是對競品最大的差異化。

### Decision 4: 頁面路由結構（SEO 導向）

**選擇**:
```
/                          → 首頁
/armor                     → 防具列表
/armor/[slug]              → 單一防具詳情
/weapons                   → 武器列表
/weapons/[type]            → 武器類型頁
/weapons/[type]/[slug]     → 單一武器詳情
/skills                    → 技能列表
/skills/[slug]             → 單一技能詳情
/driftstones               → 漂流石一覽
/driftstones/[type]        → 單一漂流石詳情
```

**理由**: 每個實體都有獨立頁面，利於 SEO 長尾關鍵字覆蓋。使用者搜「mhn 弱點特效」可直接進入技能頁，再被引導到配裝器。

### Decision 5: Pinia Store 架構

**選擇**:
- `useEquipmentStore`: 管理裝備資料載入與快取（武器、防具）
- `useSkillStore`: 管理技能資料
- `useDriftstoneStore`: 管理漂流石資料

**理由**: 按領域分 Store，職責清晰。Phase 2 將新增 `useBuildStore` 管理配裝狀態。

### Decision 6: 圖片策略

**選擇**: Phase 1 先使用遊戲圖片，存放在 `/public/images/` 目錄下，按 `weapons/`、`armor/`、`monsters/` 分類。

**理由**: 使用者確認先用遊戲圖片。未來如有版權疑慮再替換為自繪圖示。

## Risks / Trade-offs

- **[資料正確性]** 手動建立 JSON 資料可能有錯誤 → 上線前需與官方 Help Center 交叉比對，並在頁面加入「回報錯誤」入口
- **[資料量工作量]** 全部裝備收錄工作量大 → Phase 1 先建立 Schema 和部分資料（至少 3~5 套完整裝備），確認結構正確後再批量填充
- **[圖片版權]** 使用遊戲圖片放廣告可能違反 Capcom 政策 → 短期可接受（競品也在用），中長期考慮自繪替代方案
- **[遊戲更新]** MHN 持續更新裝備和技能 → JSON 檔案結構需設計成易於新增的格式，更新時只需 append 新資料
- **[SEO 冷啟動]** 新站 SEO 需要時間 → Phase 1 先把頁面結構建好，Phase 5 再做完整 SEO 優化

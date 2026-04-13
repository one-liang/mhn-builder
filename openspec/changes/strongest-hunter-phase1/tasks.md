## 1. 資料 Schema 設計與建立

- [x] 1.1 設計並建立技能資料 `/data/skills.json`，包含所有 MHN 技能（id、name、nameEn、description、maxLevel、category、levels）
- [x] 1.2 設計並建立漂流石資料 `/data/driftstones.json`，包含 15 種神秘漂流石（A~O）及其可能技能
- [x] 1.3 設計並建立素材資料 `/data/materials.json`，包含所有升級素材
- [x] 1.4 設計並建立防具資料 `/data/armor/head.json`、`chest.json`、`arms.json`、`waist.json`、`legs.json`，收錄所有防具（滿級數值）
- [x] 1.5 設計並建立武器資料 `/data/weapons/great-sword.json`、`long-sword.json`、`sword-and-shield.json`、`hammer.json`、`bow.json`、`light-bowgun.json` 等，收錄所有武器（滿級數值）

## 2. 遊戲風格 UI 設計系統

- [x] 2.1 配置 Tailwind CSS 自訂主題：MH 遊戲色系（琥珀金 Primary、深棕 Background、深紅 Accent、米白 Text）、稀有度色彩
- [x] 2.2 建立 App Shell Layout 元件：固定頂部標題列（品牌 logo「最強獵人」）+ 可捲動內容區 + 固定底部 Tab 導航
- [x] 2.3 建立底部 Tab 導航元件：4 個 Tab（防具/武器/技能/漂流石），含路由切換與高亮狀態
- [x] 2.4 建立裝備卡片共用元件（EquipmentCard）：圖片、名稱、稀有度標示、技能標籤，觸控目標 >= 44px
- [x] 2.5 建立技能標籤元件（SkillBadge）：顯示技能名稱與等級
- [x] 2.6 建立稀有度視覺指示元件：根據 rarity 值顯示對應顏色

## 3. Pinia Store 建立

- [x] 3.1 建立 `useEquipmentStore`：載入並管理武器與防具資料，提供按部位/類型查詢方法
- [x] 3.2 建立 `useSkillStore`：載入並管理技能資料，提供按分類篩選與搜尋方法
- [x] 3.3 建立 `useDriftstoneStore`：載入並管理漂流石資料

## 4. 頁面路由與首頁

- [x] 4.1 設定 Nuxt 頁面路由結構：`/`、`/armor`、`/armor/[slug]`、`/weapons`、`/weapons/[type]`、`/weapons/[type]/[slug]`、`/skills`、`/skills/[slug]`、`/driftstones`、`/driftstones/[type]`
- [x] 4.2 建立首頁 `/`：品牌名「最強獵人」、介紹文字、4 個快速入口導航卡片（防具/武器/技能/漂流石）

## 5. 防具瀏覽功能

- [x] 5.1 建立防具列表頁面 `/armor`：卡片列表顯示所有防具，含部位篩選（頭/胸/腕/腰/腿/全部）
- [x] 5.2 建立防具詳情頁面 `/armor/[slug]`：完整資訊（名稱、大圖、套裝名、部位、稀有度、防禦力、屬性耐性、技能、素材、漂流石支援）

## 6. 武器瀏覽功能

- [x] 6.1 建立武器列表頁面 `/weapons`：按武器類型分類的入口卡片
- [x] 6.2 建立武器類型頁面 `/weapons/[type]`：該類型所有武器的卡片列表
- [x] 6.3 建立武器詳情頁面 `/weapons/[type]/[slug]`：完整資訊（名稱、圖片、類型、稀有度、攻擊力、會心率、屬性、技能、素材）

## 7. 技能瀏覽功能

- [x] 7.1 建立技能列表頁面 `/skills`：所有技能列表，含分類篩選（攻擊/屬性/防禦/耐性/輔助）與搜尋功能
- [x] 7.2 建立技能詳情頁面 `/skills/[slug]`：技能名稱、分類、描述、各等級效果、擁有此技能的裝備列表、可獲得的漂流石來源

## 8. 漂流石瀏覽功能

- [x] 8.1 建立漂流石一覽頁面 `/driftstones`：15 種神秘漂流石卡片，顯示名稱與可能技能
- [x] 8.2 建立漂流石詳情頁面 `/driftstones/[type]`：該漂流石可獲得技能的完整列表與技能連結

## 9. SEO 設定

- [x] 9.1 為所有頁面設定 SEO meta 標籤：title（含「最強獵人」品牌名）、description、og:title、og:description
- [x] 9.2 設定首頁 meta：「最強獵人 - MHN 魔物獵人 Now 配裝模擬器 | 自動配裝・技能計算・漂流石搭配」

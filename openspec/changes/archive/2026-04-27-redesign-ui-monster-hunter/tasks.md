## 1. Design Demo

- [ ] 1.1 建立 `public/design-demo.html`：單一頁面展示版本 A（獵人公會）、B（元素獵場）、C（鍛冶熔爐）三種設計方向（tab 切換），每版本包含 light/dark 預覽
- [ ] 1.2 啟動 `pnpm dev`，開啟 `localhost:3000/design-demo.html` 讓使用者確認設計方向
- [ ] 1.3 使用者確認選定版本後，記錄設計 tokens（色彩、字型）

## 2. 主題系統基礎建設

- [ ] 2.1 更新 `app/assets/css/tailwind.css`：重寫 `:root`（light mode tokens）並新增 `.dark { }` block（dark mode overrides）
- [ ] 2.2 調整 light mode 稀有度色系（rarity-1 灰色對比度 fix）
- [ ] 2.3 建立 `app/composables/useTheme.ts`：管理 dark class toggle、cookie 持久化、prefers-color-scheme 初始偵測

## 3. 佈局元件更新

- [ ] 3.1 更新 `app/layouts/default.vue`：加入主題切換按鈕（sun/moon icon，aria-label），綁定 `useTheme` composable
- [ ] 3.2 更新 `app/components/BottomNav.vue`：更新 active 樣式（符合選定設計方向）

## 4. 首頁重設計

- [ ] 4.1 更新 `app/pages/index.vue`：Hero 區塊加入漸層或背景裝飾（符合選定版本），更新快速連結卡片樣式

## 5. 核心元件更新

- [ ] 5.1 更新 `app/components/EquipmentCard.vue`：卡片背景、邊框、文字色更新
- [ ] 5.2 更新 `app/components/BuildSlot.vue`：槽位樣式與 active/filled 狀態更新
- [ ] 5.3 更新 `app/components/EquipmentSelector.vue`：Modal overlay 與搜尋欄樣式更新
- [ ] 5.4 更新 `app/components/SkillBadge.vue`：badge 背景色與文字對比度更新
- [ ] 5.5 更新 `app/components/AutoBuildPanel.vue`：面板背景與按鈕樣式更新

## 6. 各功能頁面樣式驗查

- [ ] 6.1 `app/pages/armor/index.vue`：確認篩選 tab、防具列表符合新設計
- [ ] 6.2 `app/pages/weapons/[type]/index.vue`：武器列表卡片樣式確認
- [ ] 6.3 `app/pages/skills/index.vue`：技能列表樣式確認
- [ ] 6.4 `app/pages/build/index.vue`：配裝頁面整體樣式確認

## 7. 無障礙驗証

- [ ] 7.1 用 DevTools Accessibility panel 驗証 light mode 所有主要文字對比度 ≥ 4.5:1
- [ ] 7.2 用 DevTools Accessibility panel 驗証 dark mode 所有主要文字對比度 ≥ 4.5:1
- [ ] 7.3 確認所有互動元素 touch target ≥ 44×44px
- [ ] 7.4 確認 theme toggle button 有 aria-label 且 focus ring 可見

## 8. 收尾

- [ ] 8.1 移除 `public/design-demo.html`
- [ ] 8.2 在手機（375px）、平板（768px）寬度下做最終視覺確認

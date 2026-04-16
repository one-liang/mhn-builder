## Why

Phase 1 建立了完整的 MHN 裝備資料瀏覽系統，使用者現在可以查詢所有武器、防具、技能與漂流石。但配裝模擬器才是工具的核心價值——使用者需要一個能自由搭配裝備、即時計算技能總量、並分享配裝的手動配裝功能。Phase 2 實現這個核心使用場景。

## What Changes

Phase 2 聚焦在手動配裝功能：

- 新增配裝模擬器頁面（`/build`），包含裝備格子 UI（武器/頭/胸/腕/腰/腿/漂流石）
- 點擊各裝備槽位開啟選擇器 Modal，可搜尋並選擇對應裝備
- 即時計算並顯示技能統計面板（技能總等級、進度條視覺化）
- 配裝儲存至 localStorage，下次開啟自動恢復
- 配裝序列化為 URL query string，支援複製連結分享
- 新增底部 Tab 導航的「配裝」入口（第 5 個 Tab 或取代現有首頁入口）

## Capabilities

### New Capabilities

- `build-simulator`: 手動配裝模擬器核心功能，包含裝備格子 UI、各槽位選擇器 Modal、useBuildStore 狀態管理、localStorage 持久化、URL 分享序列化

### Modified Capabilities

- `game-theme-ui`: 新增「配裝」Tab 至底部導航（新增第 5 個 Tab 項目）

## Impact

- **新頁面**：`/build`（配裝模擬器主頁面）
- **新 Store**：`useBuildStore`（管理已選裝備、技能計算、序列化/反序列化）
- **新元件**：`BuildSlot.vue`（單一裝備槽位）、`EquipmentSelector.vue`（選擇器 Modal）、`SkillSummary.vue`（技能統計面板）
- **修改**：底部導航 `BottomNav.vue` 新增配裝 Tab
- **依賴**：建立在 Phase 1 的 `useEquipmentStore`、`useSkillStore`、`useDriftstoneStore` 之上，不需新增重大套件依賴

# Phase 3：自動配裝演算法 + 配裝評分/推薦

## Why

Phase 2 完成了手動配裝模擬器，使用者可以自由搭配裝備並即時看到技能合計。但面對超過 2,700 件武器、1,250 件防具的資料量，手動逐一搜尋「哪些裝備能達到攻擊 Lv3 + 看破 Lv2」非常費時。Phase 3 的核心價值是讓系統自動完成這個搜尋工作，使用者只需說明目標，系統在數十毫秒內給出最佳配裝建議。

## What Changes

Phase 3 聚焦在自動配裝與評分功能：

- 在配裝模擬器頁面（`/build`）新增**可收合的自動配裝面板**
- 使用者選擇目標技能（最多 6 項）並指定期望等級
- 可選擇限定武器類型（14 種類型 pill 過濾器）
- 點擊「開始搜尋」，系統在 ~10-50ms 內搜尋最佳組合，顯示 top-3 建議配裝
- 每個建議配裝顯示：技能達成率進度條、總防禦值、6 件裝備預覽、未達成技能差量
- 點擊「套用此配裝」一鍵將建議套用到手動配裝區

## Capabilities

### New Capabilities

- `auto-build-algorithm`：K=8 greedy filter + full enumerate 演算法核心，純 TypeScript 無 Vue/Pinia 依賴（`app/lib/autoBuildAlgorithm.ts`）
- `auto-build-ui`：自動配裝面板 UI，包含目標技能設定、武器類型過濾、結果卡片（`AutoBuildPanel.vue`、`AutoBuildSkillPicker.vue`）

### Modified Capabilities

- `build-simulator`：`/build` 頁面頂部加入 `<AutoBuildPanel>` 可收合面板，與手動配裝工作流程完全隔離

## Impact

- **新檔案**：
  - `app/lib/autoBuildAlgorithm.ts`（純演算法）
  - `app/stores/autoBuild.ts`（Pinia Store）
  - `app/components/AutoBuildPanel.vue`（主要 UI）
  - `app/components/AutoBuildSkillPicker.vue`（技能選擇 modal）
- **修改**：`app/pages/build/index.vue`（加入 `<AutoBuildPanel>`，加入 toast 支援）
- **依賴**：建立在 Phase 2 的 `useBuildStore`（`setSlot()`）、`useEquipmentStore`（`allArmor`、`weapons`）、`useSkillStore`（`getById()`）之上，無新套件依賴
- **效能**：8^5 = 32,768 組合，V8 JS ~10-15ms，遠低於 2s 預算，無需 Web Worker

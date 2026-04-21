# Phase 3 Tasks

## Task Group 1: 演算法核心

- [x] 建立 `app/lib/autoBuildAlgorithm.ts`
  - 定義 `TargetSkill`、`AutoBuildRequest`、`BuildResult`、`AutoBuildResult` 型別
  - 實作 `selectArmorCandidates(part, pieces, targetSkills, K): Armor[]`
  - 實作 `selectWeaponCandidates(allWeapons, request, K): Weapon[]`
  - 實作 `scoreCombo(weapon, armorMap, targetSkills, skillMap): number`
  - 實作 `buildSkillSummary(weapon, armorMap, skillMap): SkillSummaryEntry[]`
  - 實作 `runAutoBuild(request, allArmor, allWeapons, skillMap): AutoBuildResult`

## Task Group 2: Pinia Store

- [x] 建立 `app/stores/autoBuild.ts`
  - State: `targetSkills`, `weaponType`, `results`, `isRunning`, `hasRun`, `error`
  - Actions: `addTargetSkill`, `removeTargetSkill`, `updateTargetSkillLevel`, `clearTargets`
  - Action: `run()` — 呼叫 `runAutoBuild()`，傳入 equipmentStore + skillStore 資料
  - Action: `applyResult(result)` — 呼叫 `buildStore.setSlot()` 套用 6 個槽位

## Task Group 3: AutoBuildSkillPicker 元件

- [x] 建立 `app/components/AutoBuildSkillPicker.vue`
  - Props: `open: boolean`, `excludeIds: string[]`
  - Emits: `update:open`, `select(skillId: string)`
  - 視覺複用 `DriftstoneSkillPicker.vue` 結構
  - 已選技能（`excludeIds`）顯示灰化禁用

## Task Group 4: AutoBuildPanel 主要 UI

- [x] 建立 `app/components/AutoBuildPanel.vue`
  - 可收合面板（預設收合）
  - 武器類型 filter（水平 pill 按鈕）
  - 目標技能清單（技能名 + 等級點選 + 移除）
  - 「+ 新增目標技能」觸發 `AutoBuildSkillPicker`
  - 「開始搜尋」按鈕（spinner + 驗證）
  - 結果卡片 × 3（排名、達成率、防禦值、裝備預覽、未達成技能、套用按鈕）

## Task Group 5: Build 頁面整合

- [x] 修改 `app/pages/build/index.vue`
  - 在內容區頂部加入 `<AutoBuildPanel>`
  - 接收 `apply` 事件並觸發 toast 通知

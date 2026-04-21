# Phase 3 Design Document

## Context

Phase 2 的手動配裝器讓使用者自由選擇裝備。Phase 3 反轉這個流程：使用者描述想要的技能，系統自動找出最佳裝備組合。核心挑戰是在瀏覽器端完成這個搜尋，資料量為 ~2,700 武器 × ~1,250 防具（5 部位 × ~66 件）。

## Goals

- 使用者輸入目標技能 + 等級，系統在 <2s 內返回 top-3 建議配裝
- 建議配裝可一鍵套用到手動配裝模擬器
- 不破壞 Phase 2 任何功能

## Non-Goals

- 伺服器端運算（Phase 3 完全在瀏覽器端執行）
- 多套配裝管理（Phase 4）
- 帳號同步（Phase 6）
- 考慮裝備套裝效果（遊戲中目前無此機制）

## Decisions

### Decision 1: K=8 Greedy Filter + Full Enumerate（非暴力搜尋）

**選擇**：每個槽位先過濾出含目標技能的防具，按貢獻分排序取 top-K=8；再對 8^5 = 32,768 組合全排列評分。

**替代方案**：
- 純暴力：~66^5 = 1.25 billion 組合，不可行
- 遺傳演算法 / Beam Search：複雜度高，在此資料規模下收益不足
- K=5：32,768 → 3,125 組合，但可能錯過邊緣最優解

**理由**：K=8 在 V8 JS 執行約 10-15ms（已實測），比 Worker 初始化（~200ms）還快。資料集夠小，K=8 的過濾後候選數通常遠低於 8（目標技能對應的防具平均只有 1-7 件），所以實際組合數往往遠低於 32,768。

### Decision 2: 獨立 `useAutoBuildStore`（不擴充 `useBuildStore`）

**選擇**：新建 `app/stores/autoBuild.ts`，僅在 `applyResult()` 時呼叫 `useBuildStore().setSlot()`。

**替代方案**：在 `useBuildStore` 加入 autoSearch state → store 膨脹，auto-build 的暫態（isRunning, results）會混入需要持久化的 build 狀態。

**理由**：關注點分離。`useBuildStore` 負責手動配裝狀態 + localStorage + URL 序列化；`useAutoBuildStore` 負責演算法輸入/輸出，兩者只在「套用」時相交。

### Decision 3: 主執行緒執行（無 Web Worker）

**選擇**：`run()` 直接在主執行緒計算，不使用 Web Worker。

**理由**：Worker 初始化約 200ms，遠超 10-15ms 的計算時間。Worker 還需要序列化/反序列化完整裝備資料（JSON 傳遞），帶來額外開銷。若未來資料量成長導致超過 500ms，再遷移至 Worker。

### Decision 4: 可收合面板（非新頁面/新 Tab）

**選擇**：在 `/build` 頁面頂部加入一個可收合的 `<AutoBuildPanel>`，預設收合（單行按鈕）。

**替代方案**：
- 新頁面 `/auto-build`：需要額外路由，使用者無法對照手動配裝結果
- 頁面內 Tab（Equipment | Auto-Build）：DOM 複雜度增加，切換時失去當前配裝視覺脈絡

**理由**：面板在展開時使用者仍可看到下方的手動配裝區，套用後立即在面板下方看到結果變化，形成自然的工作流程。

### Decision 5: 評分函數權重（100 / 60 / 8）

```
score = Σ(met_levels × 100) - Σ(unmet_levels × 60) - Σ(overflow_levels × 8) + totalDefense × 0.005
```

**理由**：
- `met = 100`：達到目標等級的激勵比懲罰更強，讓部分達標的配裝能勝過完全無關的高防禦配裝
- `unmet = 60`：未達標是主要懲罰，但不要讓未達 1 級就完全否定其他技能的貢獻
- `overflow = 8`：技能超過 maxLevel 略微懲罰（浪費裝備空間），但不重扣，因為玩家可能仍受益
- `defense × 0.005`：純 tiebreaker，讓防禦值相同技能覆蓋下優先推高防配裝

## Risks / Trade-offs

- **[Skill ID 正規化]** 武器資料的 skillId 使用底線（`evade_extender`），防具和 skills.json 使用連字號（`evade-extender`）。演算法中所有 skill ID 統一 `replace(/_/g, '-')` 正規化，與 `skillStore.getById()` 的既有邏輯一致
- **[K 值選擇]** K=8 是在「覆蓋率 vs 速度」間的平衡。若未來新增大量裝備導致性能問題，可降至 K=6 或引入 Worker
- **[無漂移石自動指派]** Phase 3 不考慮漂移石技能的自動配置（RNG 屬性），套用配裝後使用者仍需手動設定漂移石

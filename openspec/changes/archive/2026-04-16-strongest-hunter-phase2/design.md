## Context

「最強獵人」Phase 1 已完成完整裝備資料瀏覽系統，使用者可以查看所有武器、防具、技能與漂流石。Phase 2 在此基礎上加入手動配裝功能——使用者在一個頁面內選齊全套裝備，即時查看技能合計，並能儲存與分享配裝。

技術棧：Nuxt 4 + shadcn-vue + Tailwind CSS + Pinia。現有 `useEquipmentStore`、`useSkillStore`、`useDriftstoneStore` 已提供完整資料存取能力。

## Goals / Non-Goals

**Goals:**

- 建立 `/build` 配裝模擬器頁面，包含裝備格子 UI（武器/頭/胸/腕/腰/腿/漂流石 7 個槽位）
- 點擊槽位開啟選擇器 Modal，支援文字搜尋與捲動選擇
- 即時計算所有已選裝備的技能加總並顯示進度條
- 使用 localStorage 自動儲存與恢復配裝
- 將配裝序列化為 URL query string 支援分享
- 底部導航新增「配裝」Tab（共 5 個 Tab）

**Non-Goals:**

- 自動配裝演算法（Phase 3）
- 多套配裝管理（Phase 4）
- 帳號同步（Phase 6）
- 配裝評分或推薦（Phase 3）

## Decisions

### Decision 1: 配裝狀態管理 — useBuildStore

**選擇**: 新建 `useBuildStore` Pinia Store，管理配裝狀態。Store 結構：
```ts
{
  weapon: WeaponItem | null,
  armor: { head, chest, arms, waist, legs } | null per slot,
  driftstone: DriftstoneItem | null
}
```
計算屬性 `skillSummary` 聚合所有已選裝備的技能，輸出 `Record<skillId, totalLevel>`。

**替代方案**: 使用 composable 而非 Store → 選 Store 因為可跨元件共享狀態（槽位元件 + 技能面板元件都需要讀取）。

**理由**: 集中管理配裝狀態，方便序列化（localStorage / URL）和計算。

### Decision 2: 選擇器 Modal 實作

**選擇**: 使用 shadcn-vue 的 `Dialog` 元件作為 Modal 基底，加入裝備列表（可搜尋、可捲動）。每個槽位類型開啟對應的選擇器（武器選武器、頭部選頭部防具等）。

**Modal 內容**:
- 搜尋框（即時過濾）
- 裝備列表（名稱、稀有度、技能標籤）
- 「取消選擇」選項（清除該槽位）

**替代方案**: 導航至獨立選擇頁面 → 使用 Modal 保留配裝上下文，體驗更流暢。

### Decision 3: URL 序列化格式

**選擇**: 使用 URL query string 序列化配裝，格式如：
```
/build?w=rathalos-blade&h=rathalos-helm&c=rathalos-mail&a=rathalos-vambraces&wa=rathalos-coil&l=rathalos-greaves&d=G
```
參數縮寫：`w`=weapon, `h`=head, `c`=chest, `a`=arms, `wa`=waist, `l`=legs, `d`=driftstone

**替代方案**: Base64 編碼整個配裝物件 → 使用可讀 slug 便於 debug 且 URL 不會過長。

**理由**: 裝備以 slug 識別，URL 長度可控（約 100~150 字元），可讀性好。

### Decision 4: localStorage 鍵名與時機

**選擇**: 鍵名 `mhn-builder-current-build`，儲存 JSON 格式的配裝 slug 集合。每次選擇/清除裝備後自動儲存（watch buildStore state）。頁面載入時優先讀取 URL params，若無則從 localStorage 恢復。

**理由**: 簡單可靠，不需登入，一般使用者只需要記住一套當前配裝。

### Decision 5: 底部導航調整

**選擇**: 底部導航從 4 個 Tab 擴充為 5 個 Tab，新增「配裝」Tab（圖示：劍盾交叉）。5 Tab 在手機上仍然可用（每個 Tab 約 68px 寬，375px 螢幕可容納）。

**替代方案**: 以首頁 Tab 取代（移除首頁 Tab 改為配裝）→ 選擇新增，保留首頁入口，讓「最強獵人」品牌首頁依然可達。

## Risks / Trade-offs

- **[技能等級上限]** 部分技能有最高等級限制，多件裝備疊加可能超過上限 → Phase 2 先顯示實際加總（不裁切），Phase 3 自動配裝時再處理上限邏輯
- **[漂流石技能不確定性]** 漂流石實際技能由遊戲 RNG 決定，Phase 2 顯示「此漂流石可能有 XX 技能」而非固定等級 → 在 UI 加入說明文字，不影響核心功能
- **[5 Tab 空間]** 手機底部導航 5 個 Tab 空間略緊 → 使用圖示為主、文字縮短（配裝→配）或在極小螢幕隱藏文字
- **[URL 長度]** 若未來支援多漂流石，URL 可能變長 → Phase 2 只支援單一漂流石，URL 格式可在 Phase 4 再重設計

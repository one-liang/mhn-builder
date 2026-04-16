## 1. useBuildStore 狀態管理

- [x] 1.1 建立 `app/stores/build.ts`：定義配裝狀態結構（weapon, head, chest, arms, waist, legs, driftstone），每個槽位存放對應裝備物件或 null
- [x] 1.2 實作 `skillSummary` 計算屬性：聚合所有已選裝備的技能，回傳 `Record<skillId, { name, total, max }>` 格式
- [x] 1.3 實作 `setSlot(slot, item)` 和 `clearSlot(slot)` action
- [x] 1.4 實作 `serialize()` 方法：將配裝序列化為 URL query string（`w`, `h`, `c`, `a`, `wa`, `l`, `d` 參數）
- [x] 1.5 實作 `deserialize(params)` 方法：從 URL query string 或 localStorage 反序列化配裝，透過 slug 查找裝備物件
- [x] 1.6 實作 localStorage 自動存讀：watch 配裝狀態變化時自動儲存；初始化時從 localStorage 恢復

## 2. 裝備選擇器 Modal 元件

- [x] 2.1 建立 `app/components/EquipmentSelector.vue`：基於 shadcn-vue Dialog，接收 `slot-type`（weapon/head/chest/arms/waist/legs/driftstone）prop
- [x] 2.2 實作搜尋框：使用 `ref` 綁定搜尋文字，computed 即時過濾對應裝備列表
- [x] 2.3 實作裝備列表：顯示名稱、稀有度指示、技能標籤，點擊觸發 `selectEquipment(item)` 並關閉 Modal
- [x] 2.4 實作「取消選擇」選項：列表頂部固定顯示，點擊清除該槽位並關閉 Modal
- [x] 2.5 武器選擇器整合所有武器類型（跨 great-sword, long-sword 等 JSON 檔案合併顯示）

## 3. 配裝槽位元件

- [x] 3.1 建立 `app/components/BuildSlot.vue`：接收 `slot` prop（槽位類型），顯示已選裝備或「未選擇」狀態
- [x] 3.2 未選擇狀態：顯示部位圖示（使用現有 ArmorPartIcon/WeaponTypeIcon）+ 灰色「未選擇」文字 + 箭頭符號
- [x] 3.3 已選擇狀態：顯示裝備名稱、稀有度顏色標示、最多 2 個技能標籤（使用現有 SkillBadge）
- [x] 3.4 點擊槽位時開啟對應的 EquipmentSelector Modal

## 4. 技能統計面板元件

- [x] 4.1 建立 `app/components/SkillSummary.vue`：讀取 `useBuildStore().skillSummary` 計算屬性
- [x] 4.2 空配裝狀態：顯示「尚未選擇裝備，開始組合你的配裝吧！」提示文字
- [x] 4.3 技能列表顯示：每個技能顯示名稱、等級文字（Lv N）、點狀進度條（依 max level 渲染）
- [x] 4.4 進度條樣式：以 MH 風格的圓點 ●/○ 表示目前等級與最高等級，使用 primary 色彩（琥珀金）

## 5. 配裝模擬器主頁面

- [x] 5.1 建立 `app/pages/build/index.vue`：配裝模擬器主頁面，路由 `/build`
- [x] 5.2 頁面佈局：頂部「配裝模擬器」標題 + 7 個 BuildSlot 排列（武器獨立一排、防具 5 個部位、漂流石獨立一排）
- [x] 5.3 整合 SkillSummary 元件顯示於槽位下方
- [x] 5.4 新增「分享配裝」按鈕：呼叫 `useBuildStore().serialize()`，使用 Clipboard API 複製 URL，顯示「已複製連結！」Toast 提示（使用 shadcn-vue Toast/Sonner）
- [x] 5.5 頁面初始化邏輯：優先讀取 URL query params 反序列化配裝，若無 params 則從 localStorage 恢復
- [x] 5.6 設定 SEO meta：`title: "配裝模擬器 | 最強獵人 - MHN 配裝模擬器"`, 加入 description

## 6. 底部導航更新

- [x] 6.1 修改 `app/components/BottomNav.vue`：新增第 5 個 Tab「配裝」，路由指向 `/build`，圖示使用劍盾或自訂 icon
- [x] 6.2 確認 5 個 Tab 在 375px 螢幕寬度下排列正常（可縮短文字標籤或縮小字號）
- [x] 6.3 確認 `/build` 路徑時「配裝」Tab 正確高亮

## 7. 整合測試與 UX 驗證

- [x] 7.1 完整流程測試：選齊 7 個槽位 → 技能面板即時更新 → 分享按鈕複製 URL → 開啟分享 URL 恢復配裝
- [x] 7.2 清除槽位測試：點擊「取消選擇」後對應槽位歸零，技能面板移除對應技能
- [x] 7.3 localStorage 測試：選裝備後重新整理頁面，配裝 SHALL 自動恢復
- [x] 7.4 搜尋功能測試：在選擇器中搜尋裝備名稱，驗證即時過濾正確

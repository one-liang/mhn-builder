### Requirement: Build simulator page
系統 SHALL 提供配裝模擬器頁面（路由 `/build`），頁面包含 6 個裝備槽位（武器、頭部、胸部、腕部、腰部、腿部）。每個槽位 SHALL 顯示目前已選裝備名稱與技能 badge，若未選擇則顯示「未選擇」提示文字。防具槽位右側 SHALL 依據裝備的漂移槽數量顯示對應的漂移石鑲嵌圓圈。

#### Scenario: View build simulator
- **WHEN** 使用者導航至 `/build`
- **THEN** 頁面 SHALL 顯示 6 個裝備槽位格子，包含武器、頭/胸/腕/腰/腿防具

#### Scenario: Unselected slot display
- **WHEN** 裝備槽位尚未選擇任何裝備
- **THEN** 該槽位 SHALL 顯示「未選擇」灰色提示文字和部位圖示

#### Scenario: Selected slot display
- **WHEN** 使用者已選擇某裝備至槽位
- **THEN** 該槽位 SHALL 顯示裝備名稱以及最多 3 個技能標籤（badge）

### Requirement: Equipment selector modal
系統 SHALL 在使用者點擊裝備槽位時，開啟對應的裝備選擇器 Modal。Modal SHALL 列出該槽位類型的所有可選裝備，並提供文字搜尋即時過濾功能。Modal SHALL 包含「取消選擇」選項以清除該槽位。

#### Scenario: Open equipment selector
- **WHEN** 使用者點擊武器槽位
- **THEN** 系統 SHALL 開啟顯示所有武器（跨類型）的選擇器 Modal

#### Scenario: Open armor part selector
- **WHEN** 使用者點擊頭部槽位
- **THEN** 系統 SHALL 開啟僅顯示頭部防具的選擇器 Modal

#### Scenario: Search equipment in selector
- **WHEN** 使用者在選擇器搜尋框輸入「火龍」
- **THEN** Modal 列表 SHALL 即時篩選顯示名稱包含「火龍」的裝備

#### Scenario: Select equipment from modal
- **WHEN** 使用者點擊選擇器 Modal 中的某件裝備
- **THEN** Modal SHALL 關閉，該裝備 SHALL 填入對應槽位

#### Scenario: Clear equipment slot
- **WHEN** 使用者在選擇器 Modal 中點擊「取消選擇」
- **THEN** Modal SHALL 關閉，對應槽位 SHALL 清除為「未選擇」狀態

### Requirement: Driftstone skill embedding
系統 SHALL 在防具槽位右側顯示對應數量的漂移石鑲嵌槽（依 `driftstoneSlots` 欄位）。每個漂移槽 SHALL 可點擊開啟技能選擇器，選擇的技能 SHALL 貢獻 Lv1 至技能合計。

#### Scenario: Driftstone slot display
- **WHEN** 防具已選且 `driftstoneSlots > 0`
- **THEN** 防具卡片右側 SHALL 顯示對應數量的漂移石圓圈按鈕

#### Scenario: Assign driftstone skill
- **WHEN** 使用者點擊漂移石圓圈並選擇技能
- **THEN** 該技能 SHALL 加入技能合計，貢獻 Lv1

### Requirement: Real-time skill summary panel
系統 SHALL 在配裝模擬器頁面裝備區下方顯示技能統計面板，即時聚合所有已選裝備（含漂移石技能）的技能等級加總。每個技能 SHALL 顯示技能名稱、當前等級（進度條）、最高等級。

#### Scenario: Skill summary updates on selection
- **WHEN** 使用者選擇一件提供「攻擊 Lv2」的防具
- **THEN** 技能統計面板 SHALL 即時更新顯示「攻擊 Lv2」

#### Scenario: Skill stacking
- **WHEN** 使用者已選頭部（攻擊 Lv1）和胸部（攻擊 Lv2）
- **THEN** 技能統計面板 SHALL 顯示「攻擊 Lv3」

#### Scenario: Empty build skill summary
- **WHEN** 所有槽位均未選擇裝備
- **THEN** 技能統計面板 SHALL 顯示「尚未選擇裝備，開始組合你的配裝吧！」提示

#### Scenario: Skill level progress bar
- **WHEN** 技能統計面板顯示某技能
- **THEN** SHALL 以進度條（點狀）視覺化顯示當前等級相對最高等級的比例

### Requirement: Build persistence via localStorage
系統 SHALL 自動將當前配裝儲存至瀏覽器 localStorage（鍵名 `mhn-builder-current-build`）。使用者重新開啟網站時，系統 SHALL 從 localStorage 恢復上次配裝。

#### Scenario: Auto-save on equipment selection
- **WHEN** 使用者選擇任一裝備至槽位
- **THEN** 系統 SHALL 自動將完整配裝狀態儲存至 localStorage

#### Scenario: Restore build on page load
- **WHEN** 使用者重新開啟 `/build` 頁面且 localStorage 有儲存的配裝
- **THEN** 頁面 SHALL 自動恢復上次的配裝選擇，各槽位顯示對應裝備

#### Scenario: URL params take priority over localStorage
- **WHEN** 使用者開啟含有配裝 URL params 的 `/build` 連結
- **THEN** 系統 SHALL 優先使用 URL params 解析配裝，忽略 localStorage 儲存的配裝

### Requirement: Build sharing via URL
系統 SHALL 在配裝頁面提供「分享配裝」按鈕。點擊後將當前配裝序列化為 URL query string（格式：`/build?w=<slug>&h=<slug>&c=<slug>&a=<slug>&wa=<slug>&l=<slug>`），並複製至剪貼板。

#### Scenario: Share build button
- **WHEN** 使用者在配裝模擬器頁面點擊「分享配裝」按鈕
- **THEN** 系統 SHALL 生成包含當前配裝的 URL 並複製至剪貼板，顯示「已複製連結！」提示

#### Scenario: Open shared build URL
- **WHEN** 使用者開啟帶有完整配裝 params 的 URL（如 `/build?w=rathalos-blade&h=rathalos-helm`）
- **THEN** 頁面 SHALL 解析 URL params 並自動填入對應槽位，呈現完整配裝

#### Scenario: Partial build URL
- **WHEN** 使用者開啟只有部分 params 的配裝 URL（如只有武器和頭部）
- **THEN** 頁面 SHALL 填入有效的槽位，其餘槽位顯示「未選擇」

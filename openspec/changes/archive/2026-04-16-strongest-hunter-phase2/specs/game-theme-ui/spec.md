## MODIFIED Requirements

### Requirement: Bottom tab navigation
系統 SHALL 在手機版提供固定於螢幕底部的 Tab 導航列，包含以下 5 個 Tab：防具（Armor）、武器（Weapons）、技能（Skills）、漂流石（Driftstones）、配裝（Build）。當前所在 Tab SHALL 以視覺高亮標示。導航列 SHALL 位於拇指自然觸及區域。

#### Scenario: Tab navigation display
- **WHEN** 使用者在手機上開啟網站
- **THEN** 底部 SHALL 顯示固定的 5 個 Tab 導航按鈕（防具、武器、技能、漂流石、配裝）

#### Scenario: Active tab highlight
- **WHEN** 使用者位於防具列表頁面
- **THEN** 底部導航的「防具」Tab SHALL 以高亮狀態顯示

#### Scenario: Tab navigation routing
- **WHEN** 使用者點擊底部「配裝」Tab
- **THEN** 頁面 SHALL 導航至配裝模擬器頁面 `/build`

#### Scenario: Build tab highlight
- **WHEN** 使用者位於 `/build` 頁面
- **THEN** 底部導航的「配裝」Tab SHALL 以高亮狀態顯示

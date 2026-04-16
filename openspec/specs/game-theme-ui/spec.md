### Requirement: Monster Hunter game-themed color system
系統 SHALL 使用魔物獵人遊戲風格的暗色系配色方案。主要色系包含：Primary 琥珀金（用於重點元素與互動元件）、Background 深棕（整體背景）、Surface 較淺棕（卡片與區塊背景）、Accent 深紅（強調與警告）、Text 米白（主要文字）。色系 SHALL 透過 Tailwind CSS 自訂主題變數定義。

#### Scenario: Dark theme applied globally
- **WHEN** 使用者開啟網站任意頁面
- **THEN** 頁面 SHALL 使用深色背景搭配淺色文字，呈現魔物獵人風格

#### Scenario: Interactive elements use primary color
- **WHEN** 頁面顯示可互動元素（按鈕、連結、選中狀態）
- **THEN** SHALL 使用琥珀金系色彩標示

### Requirement: Mobile-first responsive layout
系統 SHALL 以手機螢幕（375px~428px 寬度）為主要設計目標。所有頁面 SHALL 在手機上完整可用，不需要橫向捲動。桌面版為次要支援，使用 max-width 容器居中顯示。

#### Scenario: Mobile viewport rendering
- **WHEN** 使用者以手機螢幕（寬度 375px）開啟網站
- **THEN** 所有內容 SHALL 完整顯示在螢幕寬度內，無水平捲軸

#### Scenario: Desktop viewport rendering
- **WHEN** 使用者以桌面螢幕（寬度 1440px）開啟網站
- **THEN** 內容 SHALL 以 max-width 容器居中顯示

### Requirement: Bottom tab navigation
系統 SHALL 在手機版提供固定於螢幕底部的 Tab 導航列，包含以下 4 個 Tab：防具（Armor）、武器（Weapons）、技能（Skills）、漂流石（Driftstones）。當前所在 Tab SHALL 以視覺高亮標示。導航列 SHALL 位於拇指自然觸及區域。

#### Scenario: Tab navigation display
- **WHEN** 使用者在手機上開啟網站
- **THEN** 底部 SHALL 顯示固定的 4 個 Tab 導航按鈕

#### Scenario: Active tab highlight
- **WHEN** 使用者位於防具列表頁面
- **THEN** 底部導航的「防具」Tab SHALL 以高亮狀態顯示

#### Scenario: Tab navigation routing
- **WHEN** 使用者點擊底部「技能」Tab
- **THEN** 頁面 SHALL 導航至技能列表頁面

### Requirement: Card-based equipment display
系統 SHALL 使用卡片式設計展示裝備項目，每張卡片包含：裝備圖片（左側或上方）、裝備名稱、稀有度指示、技能標籤。卡片 SHALL 有適當的觸控目標大小（最小 44px 高度）。

#### Scenario: Armor card display
- **WHEN** 使用者瀏覽防具列表
- **THEN** 每件防具 SHALL 以卡片形式顯示，包含圖片、名稱、稀有度、技能標籤

#### Scenario: Touch target size
- **WHEN** 使用者在手機上操作
- **THEN** 所有可點擊的卡片與按鈕 SHALL 具有至少 44px 的觸控目標高度

### Requirement: App shell layout
系統 SHALL 使用 App Shell 架構，包含：頂部標題列（顯示當前頁面名稱 + 品牌 logo「最強獵人」）、主內容區域（可捲動）、底部 Tab 導航列（固定）。主內容區域 SHALL 在頂部與底部導航之間可自由捲動，不受固定元素遮擋。

#### Scenario: App shell structure
- **WHEN** 使用者開啟任意頁面
- **THEN** 頁面 SHALL 呈現固定頂部標題列 + 可捲動內容區 + 固定底部導航的三層結構

#### Scenario: Content area scrollable
- **WHEN** 內容超過可視區域高度
- **THEN** 內容區域 SHALL 可獨立捲動，頂部和底部導航保持固定

### Requirement: Rarity visual indicator
系統 SHALL 根據裝備稀有度（rarity）以不同顏色標示。低稀有度使用灰/白色系，中稀有度使用綠/藍色系，高稀有度使用金/紫色系。

#### Scenario: High rarity weapon display
- **WHEN** 顯示高稀有度武器
- **THEN** 該武器卡片 SHALL 使用金色或紫色系的稀有度標示

#### Scenario: Low rarity armor display
- **WHEN** 顯示低稀有度防具
- **THEN** 該防具卡片 SHALL 使用灰色或白色系的稀有度標示

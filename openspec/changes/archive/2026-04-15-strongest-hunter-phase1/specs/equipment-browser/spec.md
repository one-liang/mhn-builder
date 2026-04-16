## ADDED Requirements

### Requirement: Armor list page
系統 SHALL 提供防具列表頁面（路由 `/armor`），顯示所有防具。頁面 SHALL 支援按部位（頭/胸/腕/腰/腿）篩選，預設顯示所有部位。每件防具以卡片形式顯示，包含名稱、圖片、稀有度、附帶技能。

#### Scenario: View all armor
- **WHEN** 使用者導航至 `/armor`
- **THEN** 頁面 SHALL 顯示所有防具的卡片列表

#### Scenario: Filter by armor part
- **WHEN** 使用者選擇「頭」篩選
- **THEN** 列表 SHALL 僅顯示頭部防具

#### Scenario: Armor card content
- **WHEN** 防具卡片顯示
- **THEN** SHALL 包含防具名稱、圖片縮圖、稀有度標示、技能名稱與等級標籤

### Requirement: Armor detail page
系統 SHALL 提供單一防具詳情頁面（路由 `/armor/[slug]`），顯示完整資訊：名稱、圖片（大圖）、套裝名稱、部位、稀有度、防禦力數值、屬性耐性（火/水/雷/冰/龍）、附帶技能（含等級）、升級所需素材、是否支援漂流石。

#### Scenario: View armor detail
- **WHEN** 使用者點擊防具卡片或導航至 `/armor/rathalos-helm`
- **THEN** 頁面 SHALL 顯示該防具的完整詳情資訊

#### Scenario: Armor skill display
- **WHEN** 防具擁有技能（如攻擊 Lv2）
- **THEN** 詳情頁 SHALL 顯示技能名稱、等級、並提供連結至技能詳情頁

#### Scenario: Armor material display
- **WHEN** 防具需要升級素材
- **THEN** 詳情頁 SHALL 列出所有所需素材名稱與數量

### Requirement: Weapon list page
系統 SHALL 提供武器列表頁面（路由 `/weapons`），按武器類型分類顯示。使用者可選擇武器類型（大劍、太刀、片手劍、錘、弓、輕弩等）查看該類型的所有武器。

#### Scenario: View weapon types
- **WHEN** 使用者導航至 `/weapons`
- **THEN** 頁面 SHALL 顯示所有武器類型的入口卡片

#### Scenario: View weapons by type
- **WHEN** 使用者選擇「太刀」類型或導航至 `/weapons/long-sword`
- **THEN** 頁面 SHALL 顯示所有太刀類武器的卡片列表

### Requirement: Weapon detail page
系統 SHALL 提供單一武器詳情頁面（路由 `/weapons/[type]/[slug]`），顯示完整資訊：名稱、圖片、武器類型、稀有度、攻擊力、會心率、屬性（類型與數值）、附帶技能（含等級）、升級所需素材。

#### Scenario: View weapon detail
- **WHEN** 使用者點擊武器卡片或導航至 `/weapons/long-sword/nargacuga-blade`
- **THEN** 頁面 SHALL 顯示該武器的完整詳情資訊

#### Scenario: Weapon element display
- **WHEN** 武器具有屬性攻擊
- **THEN** 詳情頁 SHALL 顯示屬性類型圖示/標籤與屬性數值

### Requirement: Skill list page
系統 SHALL 提供技能列表頁面（路由 `/skills`），顯示所有技能。頁面 SHALL 支援按分類（攻擊/屬性/防禦/耐性/輔助）篩選。每個技能顯示名稱、分類標籤、最高等級、簡短描述。

#### Scenario: View all skills
- **WHEN** 使用者導航至 `/skills`
- **THEN** 頁面 SHALL 顯示所有技能的列表

#### Scenario: Filter skills by category
- **WHEN** 使用者選擇「攻擊」分類篩選
- **THEN** 列表 SHALL 僅顯示攻擊類技能

#### Scenario: Skill search
- **WHEN** 使用者在搜尋框輸入「弱點」
- **THEN** 列表 SHALL 篩選顯示名稱包含「弱點」的技能

### Requirement: Skill detail page
系統 SHALL 提供單一技能詳情頁面（路由 `/skills/[slug]`），顯示完整資訊：技能名稱（中/英）、分類、描述、各等級效果列表、擁有此技能的裝備列表（含裝備名稱、部位/類型、提供的技能等級）、可從哪些漂流石獲得此技能。

#### Scenario: View skill detail
- **WHEN** 使用者導航至 `/skills/attack-boost`
- **THEN** 頁面 SHALL 顯示「攻擊」技能的完整詳情

#### Scenario: Skill level effects
- **WHEN** 技能有多個等級
- **THEN** 詳情頁 SHALL 列出每個等級的效果描述

#### Scenario: Equipment with this skill
- **WHEN** 使用者查看技能詳情頁
- **THEN** 頁面 SHALL 列出所有擁有此技能的武器和防具，含連結至各裝備詳情頁

#### Scenario: Driftstone source
- **WHEN** 技能可從漂流石獲得
- **THEN** 詳情頁 SHALL 顯示哪些漂流石類型可鍊出此技能

### Requirement: Driftstone list page
系統 SHALL 提供漂流石一覽頁面（路由 `/driftstones`），顯示 15 種神秘漂流石（A～O）。每種漂流石以卡片顯示，包含名稱與可能獲得的技能列表。

#### Scenario: View all driftstones
- **WHEN** 使用者導航至 `/driftstones`
- **THEN** 頁面 SHALL 顯示 15 種神秘漂流石的卡片

#### Scenario: Driftstone skill preview
- **WHEN** 漂流石卡片顯示
- **THEN** SHALL 列出該漂流石可能獲得的所有技能名稱

### Requirement: Driftstone detail page
系統 SHALL 提供單一漂流石詳情頁面（路由 `/driftstones/[type]`），顯示該漂流石的名稱、可獲得技能的完整列表（含技能描述與連結至技能詳情頁）。

#### Scenario: View driftstone detail
- **WHEN** 使用者導航至 `/driftstones/G`
- **THEN** 頁面 SHALL 顯示神秘漂流石【G】的詳情，包含超會心、看破、弱點特效三個技能的資訊

### Requirement: SEO meta tags for all pages
系統 SHALL 為每個頁面設定適當的 SEO meta 標籤，包含：title（含「最強獵人」品牌名）、description（繁體中文描述）、og:title、og:description。品牌名格式：「{頁面標題} | 最強獵人 - MHN 配裝模擬器」。

#### Scenario: Armor detail page SEO
- **WHEN** 搜尋引擎爬取 `/armor/rathalos-helm`
- **THEN** 頁面 title SHALL 為「火龍頭盔 | 最強獵人 - MHN 配裝模擬器」格式

#### Scenario: Skill list page SEO
- **WHEN** 搜尋引擎爬取 `/skills`
- **THEN** 頁面 SHALL 包含 title、description、og:title、og:description meta 標籤

### Requirement: Homepage
系統 SHALL 提供首頁（路由 `/`），包含品牌名「最強獵人」、簡短介紹文字、快速入口（防具、武器、技能、漂流石）的導航卡片。首頁設計 SHALL 呈現魔物獵人的遊戲氛圍。

#### Scenario: Homepage display
- **WHEN** 使用者導航至 `/`
- **THEN** 頁面 SHALL 顯示品牌名、介紹文字、4 個快速入口卡片

#### Scenario: Homepage quick navigation
- **WHEN** 使用者點擊首頁的「防具」入口卡片
- **THEN** SHALL 導航至 `/armor` 頁面

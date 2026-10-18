### Requirement: Ink & Vermilion (墨朱) color system
系統 SHALL 使用「墨朱」配色方案：冷調墨色中性色（Background／Card／Secondary／Border）搭配單一朱紅強調色（Primary）。語意色包含：Stone 青碧（所有漂流石相關元素）、Warning 琥珀（技能超出上限、未達成目標）、Destructive 玫紅（刪除類操作）、Positive 綠（正會心等正向數值）。色系 SHALL 以 OKLCH 定義於 `app/assets/css/tailwind.css` 的 CSS 自訂屬性，並透過 Tailwind CSS 主題變數使用。

#### Scenario: Primary color used sparingly
- **WHEN** 頁面顯示主要操作（開始配裝、開始搜尋、分享）、目前所在導航、已選取的目標技能
- **THEN** SHALL 使用朱紅 Primary 標示
- **AND** 一般篩選籤的選中狀態 SHALL 使用墨色反白（foreground 底、background 字），不使用 Primary

#### Scenario: Driftstone elements use stone color
- **WHEN** 頁面顯示漂移鑲嵌槽、漂流石技能或純石標記
- **THEN** SHALL 使用 Stone 青碧色系標示

### Requirement: Mobile-first responsive layout
系統 SHALL 以手機螢幕（375px~428px 寬度）為主要設計目標。所有頁面 SHALL 在手機上完整可用，不需要橫向捲動。桌面版為次要支援，使用 max-width 容器居中顯示。

#### Scenario: Mobile viewport rendering
- **WHEN** 使用者以手機螢幕（寬度 375px）開啟網站
- **THEN** 所有內容 SHALL 完整顯示在螢幕寬度內，無水平捲軸

#### Scenario: Desktop viewport rendering
- **WHEN** 使用者以桌面螢幕（寬度 1440px）開啟網站
- **THEN** 內容 SHALL 以 max-width 容器居中顯示

### Requirement: Bottom tab navigation
系統 SHALL 在手機版（寬度 < 768px）提供固定於螢幕底部的 Tab 導航列，包含以下 5 個 Tab：配裝（Build）、武器（Weapons）、防具（Armor）、技能（Skills）、漂流石（Driftstones）。當前所在 Tab SHALL 以視覺高亮標示。導航列 SHALL 位於拇指自然觸及區域。寬度 ≥ 768px 時，導航 SHALL 改為顯示在頂部標題列中。

#### Scenario: Tab navigation display
- **WHEN** 使用者在手機上開啟網站
- **THEN** 底部 SHALL 顯示固定的 5 個 Tab 導航按鈕

#### Scenario: Active tab highlight
- **WHEN** 使用者位於防具列表頁面
- **THEN** 底部導航的「防具」Tab SHALL 以高亮狀態顯示

#### Scenario: Tab navigation routing
- **WHEN** 使用者點擊底部「技能」Tab
- **THEN** 頁面 SHALL 導航至技能列表頁面

### Requirement: List-based equipment display
系統 SHALL 以單一外框、以分隔線區隔的清單列展示裝備項目，每列包含：裝備圖片（左側）、裝備名稱、關鍵數值（攻擊／屬性／會心或防禦）、技能標籤。每列 SHALL 有適當的觸控目標大小（最小 44px 高度）。

#### Scenario: Armor list display
- **WHEN** 使用者瀏覽防具列表
- **THEN** 每件防具 SHALL 以清單列形式顯示，包含圖片、名稱、系列與部位、防禦力、技能標籤

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

### Requirement: Light/dark mode toggle
The system SHALL support switching between light and dark color modes. The active mode SHALL be persisted across page reloads using a cookie named `mhn-theme`.

#### Scenario: Default to light mode on first visit
- **WHEN** a user visits the app for the first time (no `mhn-theme` cookie)
- **THEN** the app SHALL display in light mode

#### Scenario: Respect prefers-color-scheme on first visit
- **WHEN** a user visits for the first time AND their OS is set to dark mode (`prefers-color-scheme: dark`)
- **THEN** the app SHALL default to dark mode

#### Scenario: Toggle to dark mode
- **WHEN** user taps the theme toggle button in the header
- **THEN** the `<html>` element SHALL have `class="dark"` added
- **AND** the UI SHALL immediately update to dark colors
- **AND** the `mhn-theme` cookie SHALL be set to `"dark"`

#### Scenario: Toggle back to light mode
- **WHEN** user taps the theme toggle button again while in dark mode
- **THEN** the `class="dark"` SHALL be removed from `<html>`
- **AND** the `mhn-theme` cookie SHALL be set to `"light"`

#### Scenario: Persist preference across reload
- **WHEN** user reloads the page
- **THEN** the app SHALL restore the previously selected theme from the `mhn-theme` cookie

### Requirement: WCAG 2.2 AA color contrast compliance
All text and interactive elements SHALL meet WCAG 2.2 Level AA contrast requirements.

#### Scenario: Normal text contrast in light mode
- **WHEN** the app is in light mode
- **THEN** all body text SHALL have a contrast ratio of at least 4.5:1 against its background

#### Scenario: Normal text contrast in dark mode
- **WHEN** the app is in dark mode
- **THEN** all body text SHALL have a contrast ratio of at least 4.5:1 against its background

#### Scenario: Touch target size
- **WHEN** any interactive element (button, link, nav tab) is rendered
- **THEN** its minimum touch target SHALL be 44×44px

### Requirement: Reduced motion support
The system SHALL respect the user's `prefers-reduced-motion` setting.

#### Scenario: Animations disabled for reduced-motion users
- **WHEN** the user has `prefers-reduced-motion: reduce` set
- **THEN** all CSS transitions and animations SHALL be disabled or minimized

### Requirement: Modern Monster Hunter themed design system
The app SHALL use a CSS Custom Properties design system with distinct light (紙) and dark (墨) token sets. Typography SHALL use Noto Serif TC (black weight) for page titles and the brand mark, Noto Sans TC for body text, and Barlow Condensed for numerals and English eyebrow labels.

#### Scenario: Light mode renders paper theme
- **WHEN** the app is in light mode
- **THEN** the background SHALL use a cool off-white (≥ #F0F0F0 luminance range)
- **AND** primary accent SHALL be vermilion
- **AND** all cards SHALL be visually distinct from the page background

#### Scenario: Dark mode renders ink theme
- **WHEN** the app is in dark mode
- **THEN** the background SHALL be a deep blue-black ink tone
- **AND** primary accent SHALL be a brighter vermilion that stands out against the dark background

### Requirement: Theme toggle button in header
The app header SHALL include a visible toggle button for switching between light and dark modes.

#### Scenario: Toggle button visible
- **WHEN** any page is rendered
- **THEN** a theme toggle button SHALL be visible in the top-right area of the header
- **AND** the button SHALL display a sun icon in dark mode and a moon icon in light mode
- **AND** the button SHALL have an aria-label describing its action

#### Scenario: Toggle button accessible
- **WHEN** a keyboard user focuses the toggle button
- **THEN** a visible focus ring SHALL be displayed around the button

### Requirement: Mobile-first responsive layout preserved
The app SHALL maintain its mobile-first single-column layout with max-width constraint.

#### Scenario: Layout on mobile viewport
- **WHEN** the app is viewed at 375px width
- **THEN** no horizontal scroll SHALL occur
- **AND** the bottom navigation SHALL remain fixed and accessible
- **AND** content SHALL not be hidden behind the fixed header or bottom nav

### Requirement: Rarity and element colors preserved
The 9-tier rarity color system and 8 element type colors SHALL be preserved across both themes, with adjustments only for WCAG compliance where needed.

#### Scenario: Rarity colors visible in light mode
- **WHEN** the app is in light mode and equipment cards are shown
- **THEN** each rarity tier SHALL display its distinct color
- **AND** rarity indicators SHALL have sufficient contrast against card backgrounds (≥ 3:1 for non-text UI components)

#### Scenario: Element type colors visible in both modes
- **WHEN** element badges or indicators are shown in either mode
- **THEN** fire/water/thunder/ice/dragon/poison/paralysis/sleep/blast colors SHALL be visually distinct from each other

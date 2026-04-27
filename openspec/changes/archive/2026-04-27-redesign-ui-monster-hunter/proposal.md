## Why

MHN Builder 目前採用固定暗色（棕色/金色）單一主題，缺乏亮色模式與深/淺切換功能，不符合現代 Web 設計趨勢與 WCAG 2.2 無障礙規範。重新設計以提升手機端體驗、增加視覺現代感，並引入雙主題系統。

## What Changes

- 重寫 CSS Custom Properties 色彩系統，支援 light / dark 雙模式（`.dark` class 切換）
- 新增主題切換按鈕（位於 Header 右側）
- 更新全域字型與間距設計 tokens
- 重新設計 Header、BottomNav、EquipmentCard、BuildSlot、EquipmentSelector、SkillBadge 等核心元件的視覺樣式
- 重新設計首頁（index）Hero 區塊與快速連結卡片
- 保留現有 9 段稀有度色系與 8 種元素色系（功能不變，視覺微調）
- 所有互動元素確保 44×44px touch target
- 所有文字對比度 ≥ 4.5:1（WCAG 2.2 AA）

## Capabilities

### New Capabilities

- `theme-system`: 雙主題系統（light/dark），透過 CSS Custom Properties + `.dark` class 切換，並以 cookie 持久化使用者偏好
- `ui-redesign`: 現代魔物獵人風格 UI，包含新色彩方案、字型搭配、元件樣式、Hero 區塊

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `app/assets/css/tailwind.css` — 全面重寫色彩 tokens
- `app/layouts/default.vue` — 加入主題切換按鈕
- `app/components/BottomNav.vue` — 更新 active 狀態樣式
- `app/pages/index.vue` — Hero 區塊與卡片重設計
- `app/components/EquipmentCard.vue`
- `app/components/BuildSlot.vue`
- `app/components/EquipmentSelector.vue`
- `app/components/SkillBadge.vue`
- 新增 `app/composables/useTheme.ts`
- 新增 `public/design-demo.html`（三版本 demo 頁面，供選擇後移除）

## Context

MHN Builder 是 Nuxt 4 + Vue 3 + Tailwind CSS 4 的手機優先 Web App。現有主題透過 `app/assets/css/tailwind.css` 中的 CSS Custom Properties 定義，採用固定深色方案（棕色/金色）。`@custom-variant dark (&:is(.dark *))` 已定義但從未啟用。

本次設計目標：在不更動元件業務邏輯的前提下，透過色彩系統重構 + 主題切換機制 + 元件樣式更新，實現現代魔物獵人風格雙主題 UI。

## Goals / Non-Goals

**Goals:**
- 新增 light/dark 雙主題 CSS 變數系統（`:root` = light，`.dark` = dark）
- 建立 `useTheme` composable 管理主題切換與 cookie 持久化
- 更新 Header、BottomNav、主要元件與頁面的視覺樣式
- 所有顏色符合 WCAG 2.2 AA（≥4.5:1 對比度）
- 建立三版本 design-demo.html 供比較選擇

**Non-Goals:**
- 不更動元件的業務邏輯、props、emits
- 不更動資料結構（JSON / stores）
- 不引入新的 UI 元件庫
- 不做桌面版多欄佈局（維持 max-w-lg 手機優先）

## Decisions

### D1：主題切換機制 — `.dark` class on `<html>`
**選擇：** 在 `<html>` 元素加上 `class="dark"` 切換，搭配 Tailwind `@custom-variant dark (&:is(.dark *))` 已有定義。
**理由：** 現有 tailwind.css 已設定此 variant，變更最小。
**替代方案：** CSS `prefers-color-scheme` media query — 但無法讓使用者手動覆蓋偏好。

### D2：主題持久化 — useCookie (Nuxt)
**選擇：** 使用 Nuxt 的 `useCookie('mhn-theme')` 持久化使用者選擇，預設為 `'light'`。
**理由：** 無需額外套件，SSR 安全，避免 hydration mismatch。
**替代方案：** localStorage — 但會有 SSR hydration 問題。

### D3：色彩方案落地 — 三版本 demo → 使用者選擇後正式實作
**選擇：** 先以 `public/design-demo.html` 靜態頁面展示三個版本（純 HTML + inline CSS），使用者選擇後再更新 tailwind.css。
**理由：** 快速迭代，不污染主程式碼庫；確認後一次到位修改。

### D4：字型升級
**選擇：** 保留 Noto Sans TC 作為內文字型（中文支援最佳），改用 Russo One 作為 Logo/H1 標題英文字型。
**理由：** Russo One 具有遊戲感，且 Google Fonts 免費；中文內容仍需 Noto Sans TC。

### D5：元件樣式修改策略
**選擇：** 僅修改 Tailwind utility class 與 CSS custom property 參照，不更動元件 template 結構或 script 邏輯。
**理由：** 最小化 diff，降低回歸風險。

## Risks / Trade-offs

- **Hydration mismatch** → `useTheme` composable 在 `onMounted` 後才從 cookie 讀取並套用 dark class，避免 SSR/CSR 不一致
- **既有元件 hardcoded 顏色** → 部分元件使用 `text-amber-400` 等直接色，需逐一審查替換為 CSS variable 參照
- **稀有度/元素色系 WCAG 問題** → 低稀有度灰色（rarity-1 `#9ca3af`）在白色背景下對比度僅約 2.8:1，需調暗至 `#6B7280` 或加 border 補充資訊
- **Demo 頁面移除** → `public/design-demo.html` 確認後需從版本控制移除，避免進入 production

## Migration Plan

1. 建立 `public/design-demo.html`（三版本 demo）
2. 使用者確認設計方向
3. 更新 `app/assets/css/tailwind.css`（新增 light/dark tokens）
4. 建立 `app/composables/useTheme.ts`
5. 更新 `app/layouts/default.vue`（主題切換按鈕 + dark class 綁定）
6. 逐一更新元件（BottomNav → EquipmentCard → BuildSlot → EquipmentSelector → SkillBadge → 各頁面）
7. 移除 `public/design-demo.html`

**Rollback：** `git revert` 即可，所有修改集中於樣式層。

## Open Questions

- 使用者選擇哪個設計版本（A/B/C）？→ 待 demo 確認
- `prefers-color-scheme: dark` 初次造訪時是否自動套用深色？→ 建議是，但 cookie 覆蓋優先

## Why

Monster Hunter Now (MHN) 是一款手機遊戲，玩家需要搭配武器、防具與漂流石來組出最佳技能組合。目前市面上的配裝工具（mhnow.me、mhn.quest）都不是 mobile-first 設計，手機操作體驗差，且缺乏「智慧推薦」和「個人倉庫管理」功能。我們要打造一個以繁體中文為主、手機操作為核心的配裝模擬器——「最強獵人」，提供比現有工具更好的使用體驗與更智慧的配裝功能。

## What Changes

Phase 1 聚焦在資料基礎與核心骨架：

- 建立完整的 MHN 裝備資料系統（JSON），涵蓋武器、防具、技能、漂流石、素材
- 建立 Nuxt 4 專案基礎架構：路由、Layout、Pinia Store、Mobile-first UI 框架
- 打造魔物獵人遊戲風格的 UI 設計系統（暗色系、皮革/金屬質感）
- 實作裝備資料庫瀏覽功能（武器列表、防具列表、技能百科、漂流石一覽）
- 底部 Tab 導航、卡片式裝備展示、手機拇指熱區操作優化

## Capabilities

### New Capabilities

- `equipment-data`: MHN 完整裝備資料系統，包含武器、防具、技能、漂流石、素材的 JSON Schema 設計與資料建立
- `game-theme-ui`: 魔物獵人遊戲風格的 Mobile-first UI 設計系統，包含色系、字體、元件風格、底部導航
- `equipment-browser`: 裝備資料庫瀏覽功能，含武器列表、防具列表、技能百科、漂流石一覽，每項都有獨立 SEO 頁面

### Modified Capabilities

(無，這是全新專案)

## Impact

- **專案架構**：建立 `/data` 目錄存放所有 JSON 資料檔、新增多個 Nuxt 頁面路由與 Pinia Store
- **依賴**：現有 Nuxt 4 + shadcn-vue + Tailwind CSS + Pinia 技術棧，不需新增重大依賴
- **SEO**：每個裝備/技能/漂流石都有獨立頁面路由，為未來長尾關鍵字流量打基礎
- **後續階段依賴**：Phase 2（手動配裝）、Phase 3（自動配裝）都將建立在此資料與 UI 基礎之上

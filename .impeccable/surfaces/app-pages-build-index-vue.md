---
version: 1
slug: "app-pages-build-index-vue"
primary_target: "app/pages/build/index.vue"
related_targets: ["app/layouts/default.vue","app/pages/index.vue"]
---

# Surface brief: 最強獵人 app shell + build simulator

Scope: the whole web app (shell, build simulator with auto-build, equipment/skill/driftstone browsers, 我的配裝). Visitor mode: Operate.
Audience and job: MHN players on a phone between hunts, composing a build toward target skills, saving it on the device and sharing it (link or picture).
Constraints: keep the name 最強獵人, light/dark (now following the system by default, with the toggle kept as an override in the `mhn-theme` cookie), official game icons, equipment art and monster crests. Must not read like the retired Forge & Temper steel look, the old parchment look, a generic SaaS dashboard, a flashy game skin, or a knock-off of the in-game MHN UI.
Pinned by the maintainer (2026-10-21, docs/roadmap.md): minimalist flat UI after Uber's Base design system; black/white high contrast, generous whitespace, bold large headings, large radii; mobile-first card layout with one primary action per screen; View Transitions between pages, spring motion (motion-v) for components, transform/opacity only; skeletons for loading, optimistic updates; skill colours from the five official skill categories used only as small marks; bottom tab bar 配裝・防具・武器・技能・我的配裝; / goes to /build; 漂流石 lives under 技能.
Memorable moment: the skill board — every reached skill as a big black numeral over a row of level pips in its category colour, the only colour on a black-and-white screen.

## Direction contract

THESIS: A field kit, not a dashboard: the build is one white card stack you thumb through, every number set big and black, and colour appears only where a skill category speaks. Refuses the category default of dark slate panels, glowing accents and game-skin chrome.

OWN-WORLD: Pure white ground (pure black at night), #F3F3F3 filled wells for inputs and art plates, hairlines #E8E8E8. Ink is #000 with #5E5E5E secondary. The one primary action is a black pill (white at night); everything else is a grey pill or a quiet text button. Cards and sheets on 20–28px radii, chips fully round. Noto Sans TC 900 for headings at 28–40px, Inter tabular figures for every number. Five category colours (attack red, element blue, action amber, defense green, resistance grey) only as level pips and dots.

STORY: The player sees the six slots, what they reach and what is missing, fills gaps with auto-build or driftstones, then saves, screenshots or shares in one tap.

FIRST VIEWPORT: Build page, 390px. White header: wordmark left, search and theme right. Big 配裝 heading with a one-line status (6/6 件・技能 9・滿級 3). An auto-build card (black pill 自動配裝 when collapsed). The gear card: six rows, plate, name, skill line, driftstone pips, lock. Docked above the tab bar: grey 儲存, grey 截圖, black 分享連結 pill.

FORM: Pinned by the brief (Uber Base reference), no concept roll; Operate rules applied: the world lends type, palette, density and one signature move.

Signature move: the skill board. Level pips fill in category colour with a spring scale-in when gear changes; numerals tick to the new value. Sheets and toasts rise on a spring; page changes cross-fade through View Transitions.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

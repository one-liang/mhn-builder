---
version: 1
slug: "app-pages-build-index-vue"
primary_target: "app/pages/build/index.vue"
related_targets: ["app/layouts/default.vue","app/pages/index.vue"]
---

# Surface brief: 最強獵人 app shell + build simulator

Scope: the whole web app (shell, home, build simulator, equipment/skill/driftstone browsers). Visitor mode: Operate.
Audience and job: MHN players on a phone between hunts, composing a build toward target skills and sharing it.
Constraints: keep light/dark switching (`mhn-theme` cookie), the name 最強獵人, official game icons and equipment images. Must not read like the old parchment/gold/Cinzel look, a generic SaaS dashboard, a flashy hard-to-read game skin, or a knock-off of the in-game MHN UI. Bottom tab bar is not mandatory.
Memorable moment: skill levels rendered as tempered steel; a swap re-tempers the bars in place.

## Direction contract

THESIS: The build is forged work on the smithy bench. Skill levels are drawn as heat-temper oxide bands (straw → bronze → purple → blue), so reaching max reads as a fully tempered bar and overflow reads as overheated, spent grey. Refuses the category default: dark slate cards with an amber accent and fantasy serif.

OWN-WORLD: Cold-rolled steel ground in light, soot-blued steel in dark; a deep blued-steel shell band carries the brand and navigation. Temper spectrum is the only data palette. Forge orange is reserved for the one primary action per screen. Numerals and Latin set in a condensed industrial grotesk like stamped punches; CJK in a workhorse Hei. Hairline steel rules, square-ish 4px corners, no cards inside cards, no glows.

STORY: The player sees which six pieces are on, which skills they reach and how close each is to max, fixes gaps with driftstones or auto-build, then shares.

FIRST VIEWPORT: Build page on a 390px phone. Top: blued-steel band with brand mark and theme switch. Directly below: the six slots as a dense list (slot glyph, item art, name, skill chips), lock and driftstone sockets inline at the right. Below the fold edge: the skill ledger, fixed columns (name, temper bar, Lv/max). Forge-orange share action docked at the bottom above the nav.

FORM: Forge & Temper (加工屋), position 5 on the ordered grounded list; seed key fbe9400b. Raises: fixed-column ledger that updates in place (split-flap); one level = one whole cell on a shared module (Crouwel grid); max is a visible stop, overflow spills past it as spent temper (cassette J-card); each skill row opens to its sources (monochrome marketing); in browse lists only the equipment art carries full colour (streaming wall); one segment equals one level, nothing decorative shares the shape (labanotation).

Signature interaction: on any equipment or driftstone change, changed temper bars re-heat — the new segments sweep from forge-orange through the spectrum to their resting temper colour (~600ms, ease-out; instant under reduced motion).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

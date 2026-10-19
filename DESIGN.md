---
name: 最強獵人 (The Strongest Hunter)
description: 鍛冶回火 Forge & Temper. A Traditional-Chinese Monster Hunter Now build simulator drawn as forged work on a smithy bench, with skill levels read as heat-temper oxide bands.
colors:
  # Daylight bench (default, :root)
  ground: "#E4E8EB"
  panel: "#F4F6F7"
  inset: "#DCE2E6"
  rule: "#C6CED5"
  rule-strong: "#9AA6B0"
  ink: "#111B25"
  ink-2: "#46535F"
  ink-3: "#55626E"
  shell: "#182C42"
  shell-raised: "#24405E"
  shell-rule: "#2E4A68"
  shell-ink: "#EAF0F4"
  shell-ink-2: "#A9B9C8"
  forge: "#C4410C"
  forge-hover: "#A83709"
  forge-ink: "#FFFFFF"
  danger: "#B0202E"
  focus: "#111B25"
  t1: "#A88317"
  t2: "#A9652A"
  t3: "#8E4568"
  t4: "#6B3D9A"
  t5: "#2A5AA6"
  spent: "#7C8790"
  cell: "#D5DCE1"
  cell-edge: "#A8B3BC"
  # Forge at night (.dark); shell-ink and shell-ink-2 are identical in both modes
  ground-night: "#0B121A"
  panel-night: "#13202E"
  inset-night: "#1A2A3B"
  rule-night: "#24364A"
  rule-strong-night: "#3A5068"
  ink-night: "#E7EDF1"
  ink-2-night: "#9AAAB8"
  ink-3-night: "#8495A4"
  shell-night: "#13263A"
  shell-raised-night: "#1F3A56"
  shell-rule-night: "#284561"
  forge-night: "#FF6A2A"
  forge-hover-night: "#FF8550"
  forge-ink-night: "#1A0A03"
  danger-night: "#FF7B84"
  focus-night: "#E7EDF1"
  t1-night: "#E6BE52"
  t2-night: "#D98E4C"
  t3-night: "#CB6D97"
  t4-night: "#A07FE0"
  t5-night: "#5E97EE"
  spent-night: "#6B7782"
  cell-night: "#1C2C3D"
  cell-edge-night: "#3A5068"
  # Driftstone swatches (identification only, same in both modes)
  stone-red: "#C8352B"
  stone-blue: "#2F5FC4"
  stone-black: "#23272B"
  stone-white: "#F2F2EE"
  stone-yellow: "#E3B521"
  stone-sky: "#38A9D6"
typography:
  display:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "46px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.06em"
  headline:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "0.04em"
  title:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.55
  item-title:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.25
  button:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
  numeral-spec:
    fontFamily: "Saira Condensed, Noto Sans TC, ui-sans-serif, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  numeral:
    fontFamily: "Saira Condensed, Noto Sans TC, ui-sans-serif, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  numeral-inline:
    fontFamily: "Saira Condensed, Noto Sans TC, ui-sans-serif, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  brand-wordmark:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.08em"
  brand-mark:
    fontFamily: "Saira Condensed, Noto Sans TC, ui-sans-serif, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.16em"
rounded:
  cell: "1px"
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  gutter-wide: "24px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.forge}"
    textColor: "{colors.forge-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.forge-hover}"
  button-secondary:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "0 20px"
  button-secondary-hover:
    backgroundColor: "{colors.shell-raised}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.inset}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 12px"
  button-quiet-hover:
    backgroundColor: "{colors.inset}"
  input-search:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 40px"
  input-search-focus:
    backgroundColor: "{colors.panel}"
  shell-band:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    height: "56px"
    padding: "0 8px 0 16px"
  nav-tab:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink-2}"
    typography: "{typography.label}"
    height: "60px"
  nav-tab-active:
    backgroundColor: "{colors.shell-raised}"
    textColor: "{colors.shell-ink}"
  filter-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    height: "44px"
    padding: "0 12px"
  filter-tab-active:
    textColor: "{colors.ink}"
  chip-select:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "8px 12px"
  chip-select-selected:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
  temper-cell:
    backgroundColor: "{colors.cell}"
    rounded: "{rounded.cell}"
    width: "16px"
    height: "10px"
  temper-cell-sm:
    backgroundColor: "{colors.cell}"
    rounded: "{rounded.cell}"
    width: "12px"
    height: "8px"
  ledger-row:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    height: "52px"
    padding: "8px 12px 8px 16px"
  plate:
    backgroundColor: "{colors.inset}"
    rounded: "{rounded.md}"
    size: "52px"
  socket-filled:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.sm}"
    width: "44px"
  socket-empty:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    width: "44px"
  lock-toggle-on:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    width: "44px"
  switch-on:
    backgroundColor: "{colors.shell}"
    rounded: "{rounded.sm}"
    width: "48px"
    height: "28px"
  sheet-header:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    height: "56px"
  sheet-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  toast:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "0 6px 0 16px"
---

# Design System: 最強獵人 (The Strongest Hunter)

## Overview

**Creative North Star: "鍛冶回火 Forge & Temper"**

The build is forged work on the smithy bench. The page is a sheet of cold-rolled steel by day and soot-blued steel by night; a deep blued-steel band carries the brand and navigation like the tang of a blade, stamped with a maker's mark. Every skill level is drawn as a heat-temper oxide band, straw through bronze, peacock and purple to blue, so a maxed skill reads as a fully tempered bar and levels past the cap spill beyond a visible stop as spent, overheated grey. When gear changes, the affected cells re-heat from forge orange back to their resting oxide colour. That one moment is the system's signature.

The interface is dense and plain on purpose: a phone in one hand, outdoors, between hunts. Lists are divided by hairline steel rules rather than floated cards; numbers are set as condensed punch-stamped figures that can be read at a glance; CJK is a workhorse Hei that carries hierarchy through weight. Colour is rationed. The temper scale is the only data palette, forge orange marks the single primary action on a screen, and blued-steel navy carries everything else that must look solid or selected. Official game imagery (equipment art, weapon-type and armor-part glyphs, the skill icon) is the content colour on the page and sits on machined steel plates.

It must not read as the old parchment, gold and Cinzel look, as a generic SaaS dashboard, as a flashy hard-to-read game skin, or as a knock-off of the in-game MHN interface.

**Key Characteristics:**
- Steel ground, steel panel, recessed steel inset: depth by tone and 1px rules, not by shadow.
- A blued-steel shell band (header, bottom tab bar, sheet title bars) carries brand, navigation and selection.
- Skill levels as temper bars: one cell per level, oxide colour by position, a visible max stop, a spent hatch for overflow.
- Condensed stamped numerals (Saira Condensed, tabular) beside a Hei CJK workhorse (Noto Sans TC).
- One forge-orange action per screen; everything else solid is shell navy.
- Machined corners of 1 to 6px; dashed borders mean empty or add.
- Daylight is the default; dark is "forge at night".

## Colors

A cool steel neutral system with one heat colour for action and a five-stop oxide scale reserved for skill levels. Every token has a daylight value and a night value; use the semantic token (for example `bg-panel`, `text-ink-2`), never the raw hex.

### Primary
- **Forge Orange** (forge / forge-night): the heat of the forge. Fills exactly one primary action per screen: 複製分享連結 on the build page and 開始配裝 on home. Hover deepens by day (forge-hover) and brightens by night (forge-hover-night). Text on it is forge-ink. It also appears as transient heat: the text caret and the first frame of the temper keyframe.

### Secondary
- **Blued Steel** (shell, shell-raised, shell-rule): the deep navy of tempered steel. The header band, the bottom tab bar, sheet title bars, toasts, secondary solid buttons (開始搜尋, 套用選擇), and every filled or selected state: a filled driftstone socket, a locked slot, a selected skill chip, the applied auto-build plan, a switch that is on, the icon tile on index rows. shell-raised is its hover and active-tab fill; shell-rule is the hairline inside and around it.
- **Shell Ink** (shell-ink, shell-ink-2): text on blued steel; primary and secondary respectively. Identical in both modes.

### Tertiary
- **Temper Oxide Scale** (t1 straw, t2 bronze, t3 peacock, t4 purple, t5 blue; each with a night value): the only data palette. A level cell's colour is chosen by its position, `ceil(i / max × 5)`, so the last cell of any maxed skill is always t5 blue. Used in temper cells and in the five-stop legend that explains them (起步 → 滿級), nowhere else.
- **Spent** (spent / spent-night): overheated grey, drawn as a 135° hatch (2px stripe, 2px gap) with a 1px inset edge for levels past the max stop.
- **Danger** (danger / danger-night): a status colour, not data. Overflow counts (超出上限), unmet levels in auto-build (還差), negative affinity, and the hover of destructive or remove controls.

### Neutral
- **Bench Ground** (ground / ground-night): the page. Also the sticky filter header and the share dock (at 95% with a 2px blur).
- **Worked Panel** (panel / panel-night): list containers, the ledger, sheets, chips at rest.
- **Recessed Inset** (inset / inset-night): equipment plates, the search field at rest, row hover, the current item in a selector.
- **Hairline Rule** (rule / rule-night): every 1px border and list divider; the default border colour.
- **Strong Rule** (rule-strong / rule-strong-night): dashed empty-state borders, outline buttons, the resting max stop, scrollbar thumb, pipe separators in status lines.
- **Ink** (ink, ink-2, ink-3 and night values): primary text; secondary text and labels; tertiary icons, chevrons and placeholders. All three pass 4.5:1 on ground, panel and inset in both modes.
- **Focus** (focus / focus-night): the 2px focus outline, equal to ink.
- **Unlit Cell** (cell, cell-edge and night values): the empty temper cell and its 1px edge.
- **Driftstone Swatches** (stone-red, stone-blue, stone-black, stone-white, stone-yellow, stone-sky): the real stone colours, used only as 12px rotated-square swatches that identify a stone. Prime stones are a hollow ink diamond with a 4px ink core.

Rarity and element are currently shown as text only; there is no rarity or element palette.

### Named Rules
**The Temper-Only-Data Rule.** t1 to t5 appear only where they encode a skill level: temper cells and the legend that explains them. Never on borders, icons, badges, backgrounds, hovers, or charts of any other quantity.

**The One Forge Rule.** One forge-orange control per screen, and it is the primary action. Every other solid action is shell navy; forge otherwise appears only as heat (caret, temper flash).

**The Blued Selection Rule.** Selected, filled, locked and on states are shown by filling with shell navy and switching to shell ink, never by tinting with an accent colour.

## Typography

**Display Font:** Noto Sans TC (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Noto Sans TC (same stack; weights 400, 500, 700, 900 loaded)
**Label/Mono Font:** Saira Condensed (with Noto Sans TC fallback; weights 500, 600, 700, 800 loaded) for numerals and Latin marks only

**Character:** A workhorse Hei that builds hierarchy through weight, paired with a condensed industrial grotesk whose figures look punch-stamped into steel. The pairing reads as a tool, not a game skin.

### Hierarchy
- **Display** (900, 46px, 64px at ≥768px, line-height 1, tracking 0.06em): the 最強獵人 wordmark on the home band only.
- **Headline** (900, 26px, line-height 1.25, tracking 0.04em): page titles. Equipment detail headers use 24px and the skill detail header 28px, both at 0.03em; the build page title is a compact 20px.
- **Title** (700, 15px, line-height 1.55): section headings such as 裝備, 技能, 資料庫. On detail pages and in pickers the heading sits on a 2px ink rule.
- **Item Title** (700, 16px, line-height 1.375): equipment, slot and skill names in rows; 17px on index rows; 15px inside selectors.
- **Body** (400, 15px, line-height 1.55): descriptions and level effects, held to 60 to 65ch. Proportional CJK alternates are off (`palt` 0).
- **Label** (400 to 500, 12 to 13px, ink-2): field labels above values (the slot's part name, 攻擊力, 防禦), meta lines, nav labels (12px, 500).
- **Numerals** (Saira Condensed via `.stamp`, tabular lining figures, 0.01em): inline counts 15px/700 in ink beside 13px ink-2 CJK; Lv tags 14px/700; ledger and plan values 22px/800 with the /max at 15px/600 ink-2; detail level and source values 18 to 20px; spec strips 30px/800; index counts 22 to 28px/800.
- **Brand Mark** (Saira Condensed 700, 12px, uppercase, tracking 0.16em): MHN inside a 1.5px shell-ink-2 frame, 22px tall, 2px radius, beside the 19px/900 wordmark (tracking 0.08em). On the home band it scales to 16px (20px at ≥768px) with a 2px frame and 3px radius.

### Named Rules
**The Stamped Figure Rule.** Every numeral that is data (levels, counts, stats, Lv tags, n/max fractions) is set in Saira Condensed with tabular lining figures, one weight step heavier than the CJK beside it. CJK is never set in Saira.

**The Weight-Not-Size Rule.** UI text lives between 12 and 17px and takes its hierarchy from weight (900, 700, 500, 400) and ink step; only the home wordmark exceeds 30px. Uppercase tracked Latin is reserved for the MHN maker's mark.

## Layout

Mobile-first for 375 to 428px phones with a 16px side gutter; desktop is supported but secondary. On phones, lists run full-bleed with only top and bottom rules; from 768px they become boxed panels with a 1px rule border and 4px radius, and the gutter widens to 24px.

- **Containers:** the shell band and the build page are capped at 1152px; browse and detail pages at 768px.
- **Breakpoints:** 640px turns the weapon-type list and skill chip grids into two and three columns. 768px moves the tab bar from the bottom edge into the header band, turns bottom sheets into centred panels (max 576px wide, 82dvh tall), and boxes the lists. 1024px splits the build page into a gear column and a 432px skill-ledger column that sticks at 72px from the top, and moves the share action from the bottom dock into the gear header.
- **Fixed chrome:** header band 56px (sticky); bottom tab bar 60px plus the safe-area inset; sticky search-and-filter headers dock under the band at 56px; the phone share dock sticks 60px above the bottom edge.
- **Rhythm:** a 4px base. Gaps of 4, 8 and 12px inside rows; 16px gutters; 28px between page sections. Rows set the vertical cadence: 52px ledger rows, 56 to 68px reference rows, 68px selector rows, 76px build-slot and equipment rows.
- **Density:** list items are separated by 1px rule dividers, never by gaps between floating cards.
- **Touch:** every control is at least 44px; primary and sheet-footer actions are 48px.

### Named Rules
**The Fixed Column Rule.** The skill ledger is a fixed grid (name, temper bar at least 6.5rem, Lv/max 3.25rem, chevron 1rem, 10px gaps) in catalogue order. Swapping gear changes values in place; rows never reshuffle.

**The Thumb Dock Rule.** Below 1024px the primary action docks full-width at the bottom, directly above the tab bar, where the thumb already is.

## Elevation & Depth

The bench is flat. Depth comes from three tonal steps of steel (ground, panel, inset) and 1px hairline rules, with the blued-steel shell as the darkest, most solid layer. In dark mode the shell sits just above the panel tone, so the band reads as blued metal rather than a black bar. Shadows are soft, low and reserved for things lifted off the bench. There are no glows.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 -12px 32px -8px rgb(17 27 37 / 0.28)`; night `rgb(0 0 0 / 0.6)`): the bottom sheet and centred dialog panel, over a 60% dark scrim.
- **Pop** (`box-shadow: 0 10px 28px -10px rgb(17 27 37 / 0.35)`; night `rgb(0 0 0 / 0.7)`): the toast and the saved-build plate lifted off the home band.
- **Spent edge** (`box-shadow: inset 0 0 0 1px` spent): the outline of a spent overflow cell; an edge, not elevation.

### Named Rules
**The Flat Bench Rule.** Anything resting on the page is flat and separated by rules and tone. A shadow means the thing has been lifted: a sheet, a toast, or the saved build on the home band.

## Shapes

Machined, square-ish steel. Radii run 1px (temper cells), 2px (maker's mark frame, switch thumb, prime-stone tag), 3px (buttons, inputs, chips, sockets, toast, the default control radius), 4px (plates, list panels, the ledger, the auto-build panel) and 6px (the top corners of a phone sheet). Nothing is a pill and nothing is fully round.

Recurring forms:
- **Temper cells:** 16 × 10px rectangles (12 × 8px small) with 3px gaps, followed by a 2px max stop 16px tall (12px small) with 2px margins.
- **Indicator bars:** a 3px bar marks the active tab: along the top edge of a bottom tab, the bottom edge of a top-band tab, and under an active filter tab (inset 8 to 12px from the sides).
- **Heading rule:** a 2px ink rule under section headings on detail pages and in pickers.
- **Driftstone sockets:** narrow tiles at least 44px wide with the skill name set vertically (vertical-rl, upright), wrapping into extra 4-character columns, with short Latin runs (SP, UP) set tate-chu-yoko.
- **Plate tag:** an 18px shell square in the plate's lower-left corner, 3px top-right radius, carrying the part or weapon-type glyph.
- **Stone swatch:** a 12px square rotated 45°.
- **Dashed means empty:** a 1px dashed rule-strong border marks an empty slot plate, an empty socket, the add-target-skill button, and the empty ledger.

### Named Rules
**The Machined Corner Rule.** Corners stay between 1 and 6px; 3px on controls, 4px on containers.

**The Dashed-Is-Empty Rule.** A dashed border always means "nothing here yet, tap to fill"; it is never decoration.

## Components

### Buttons
Solid, square-ish, confident; colour says rank.
- **Shape:** gently squared corners (3px).
- **Primary:** forge fill, forge-ink text, 16px/700 with an 18px icon, 48px tall, full width in the phone dock; 14px/700, 44px tall, 16px side padding in the desktop header; 開始配裝 on home is 48px with 20px leading and 16px trailing padding.
- **Secondary:** shell fill, shell-ink text, 15px/700, 48px; hover shell-raised.
- **Outline:** 1px rule-strong border, ink text, 14 to 15px/700, 44 to 48px; hover inset fill. Used for 取消, 卸下, 清空.
- **Quiet:** no border, ink-2 text, 44px; hover inset fill (destructive ones such as 清除 also turn danger).
- **Add:** a 1px dashed rule-strong border, ink-2 text, 44px, plus icon.
- **Hover / Focus:** colour transitions over 200ms; focus is a 2px focus-colour outline offset 2px; disabled is 45% opacity.

### Chips
- **Style:** selectable tiles in a 2- or 3-column grid, at least 48px tall, 3px radius, 1px rule border on panel, 14px text.
- **State:** hover darkens the border to ink-2. Selected fills shell with shell-ink bold text and a check. Blocked (at the 6-skill cap) drops to ink-3 at 60%. Marked for removal shows a danger border with struck-through danger text.

### Cards / Containers
- **Corner Style:** 4px on panels from 768px; full-bleed on phones.
- **Background:** panel, with inset for hover and the current item.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1px rule, with 1px rule dividers between rows.
- **Internal Padding:** 16px leading, 12px trailing, 8 to 12px vertical; never a card inside a card.

### Inputs / Fields
- **Style:** 44px search field on inset, 1px rule border, 3px radius, 15px text, an 18px ink-3 search icon at 12px from the left, a clear button at the right.
- **Focus:** the border shifts to the focus colour and the fill lifts to panel.
- **Switch:** a 48 × 28px square-cornered track (inset with rule-strong border when off, shell when on) with a 20px 2px-radius thumb that slides 24px.

### Navigation
- **Shell band:** sticky, 56px, shell fill with a shell-rule bottom edge: the 最強獵人 wordmark and MHN maker's mark at the left, a 44px theme toggle (moon or sun) at the right.
- **Phones:** a fixed bottom tab bar, 60px plus safe area, five equal tabs (配裝, 武器, 防具, 技能, 漂流石), a 22px icon over a 12px/500 label, shell-ink-2 at rest; the active tab fills shell-raised, turns shell-ink, and carries a 3px top bar.
- **768px and up:** the same five tabs sit inline in the band, 14px/500 with an 18px icon, the active one marked by a 3px bottom bar.
- **Filter tabs:** a horizontally scrolling strip without a visible scrollbar, 44px tabs, 14px; active is ink bold with a 3px ink underline. Icons are official glyphs or stone swatches.
- **Page head:** an optional back link (13px ink-2 with a 16px arrow) above a headline title and a 13px ink-2 summary that stamps its counts.

### Sheets
Bottom sheet on phones (92dvh, 6px top corners), centred panel from 768px. A 56px shell title bar with a 44px close button, an optional controls strip (search, filter tabs) on panel above a 1px rule, a scrolling body, and an optional footer with safe-area padding. Enters with a 24px rise over 320ms and a 240ms scrim fade, both ease-out-quint. It locks page scroll, closes on Escape, returns focus, and autofocuses search only on fine pointers so a phone keyboard never covers the list.

### Temper Bar (signature)
One cell per level along a shared module; nothing decorative shares the cell's shape. Lit cells take the oxide colour for their position; unlit cells are cell with a 1px cell-edge. The max stop is a 2px bar, rule-strong at rest and ink once the skill overflows; each overflow level is a spent-hatch cell past the stop. When a level changes, only the newly lit cells heat: forge orange with a 1px forge ring, through t1 at 35%, to their resting colour, over 640ms ease-out-quint with a 45ms stagger per cell. Nothing heats on first paint; a skill that arrives after the page loads heats all its cells in. Under reduced motion it is instant.

As a control (`selectable`), the bar becomes a full-width radio group: one 44px tile per level with a stamped level number over its cell; the chosen tile is panel with an ink border and bold ink number, the rest inset with rule borders.

### Skill Ledger
A fixed-column table of every skill the build reaches, in catalogue order: the name (15px/500, with an overflow note in 12px/700 danger), the temper bar, the stamped value (22px/800, red on overflow) over /max, and a chevron. Each 52px row opens to its sources: label, piece and +level. Rows enter and leave with an 8px slide and fade over 280ms.

### Build Slot and Driftstone Sockets
A 76px row: the piece's art on a 52px plate with its part-glyph tag, the slot label (12px ink-2), the item name (16px/700), and its skills as name plus stamped Lv. An empty slot shows a dashed plate with the part glyph and 未裝備・點此選擇. Driftstone sockets sit inline at the right as vertical tiles: filled is shell with the skill name set vertically, empty is a dashed rule-strong tile reading + 漂流石. A 44px lock column closes the row behind a 1px left rule; locked fills shell.

### Plates and Official Imagery
Official game imagery is the content colour and a brand commitment. Equipment art (webp) sits on a plate: inset fill, 1px rule, 4px radius, at 40 to 56px in lists and 96px on detail headers. Weapon-type SVGs are tinted with currentColor through a CSS mask; armor-part SVGs are inline currentColor paths. Both sit on shell tiles (44 to 48px, 4px radius) on index rows, or in ink-2 in empty plates. The skill icon appears at 56px on the skill detail header; monster icons appear at 16px beside armor names. In browse lists only the equipment art carries full colour.

### Toast
A 48px shell bar (3px radius) with the pop shadow, 14px/500 shell-ink text and an optional bold 復原 undo button that fills shell-raised on hover; it rises 10px into place above the share dock over 240ms and leaves after 2.4s (5s when it offers undo).

## Do's and Don'ts

### Do:
- **Do** draw every skill level as temper cells: one cell per level, as many cells as the skill's max, coloured by `ceil(i / max × 5)` along t1 to t5, a 2px max stop after the last cell, and overflow as spent-hatch cells past the stop.
- **Do** give forge orange to exactly one control per screen, the primary action (複製分享連結 on the build page, 開始配裝 on home), and make every other solid action shell navy.
- **Do** set data numerals in Saira Condensed (`.stamp`, tabular lining figures) one weight heavier than the CJK beside them: 15px/700 inline, 22px/800 in the ledger and plan tiles, 30px/800 on spec strips.
- **Do** show selected, filled, locked and on states by filling with shell navy and switching to shell ink.
- **Do** set equipment art on the steel plate (inset, 1px rule, 4px radius) and tint official weapon-type and armor-part glyphs with currentColor.
- **Do** mark empty slots, empty sockets, add actions and empty states with a 1px dashed rule-strong border.
- **Do** keep touch targets at least 44px, primary actions 48px, and the phone gutter 16px.
- **Do** heat temper cells only when a level changes or a skill first arrives (640ms, 45ms stagger, ease-out-quint), and make it instant under reduced motion.
- **Do** design for daylight first and give every new colour token both a daylight and a night value.

### Don't:
- **Don't** use t1 to t5 anywhere except to encode a skill level: no temper-coloured borders, icons, badges, backgrounds, or charts of other quantities.
- **Don't** add a second forge-orange control, or use forge for links, hovers, selection or decoration.
- **Don't** drift back to the old parchment, gold and Cinzel look: no warm paper grounds, gold accents or fantasy serif.
- **Don't** let it read as a generic SaaS dashboard: no floating cards with resting shadows, no gradient buttons, no cards inside cards.
- **Don't** let it become a flashy game skin or a knock-off of the in-game MHN UI: no glows, metallic or decorative gradients, textured or ornamented frames, or copied in-game panel chrome. The spent hatch is the only gradient.
- **Don't** put a shadow on anything resting on the page; shadows belong to the sheet, the toast and the saved-build plate on the home band.
- **Don't** round corners beyond 6px or use pills.
- **Don't** use the stone colours outside the driftstone swatch, or let them stand in for temper, rarity or element.
- **Don't** set CJK in Saira Condensed or letterspace CJK body text; uppercase tracked Latin belongs only to the MHN maker's mark.
- **Don't** reorder ledger rows when gear changes; values update in place in catalogue order.

---
name: 最強獵人 (The Strongest Hunter)
description: 黑白野外工具 Black & White Field Kit. A Traditional-Chinese Monster Hunter Now build simulator set as a stack of white cards with big black numbers; colour appears only where a skill category speaks.
colors:
  # Day (default, :root)
  ground: "#FFFFFF"
  panel: "#F6F6F6"
  inset: "#EBEBEB"
  rule: "#E2E2E2"
  rule-strong: "#AFAFAF"
  ink: "#000000"
  ink-2: "#5E5E5E"
  ink-3: "#6B6B6B"
  shell: "#000000"
  shell-raised: "#2B2B2B"
  shell-ink: "#FFFFFF"
  shell-ink-2: "#C2C2C2"
  forge: "#000000"
  forge-hover: "#2B2B2B"
  forge-ink: "#FFFFFF"
  danger: "#C8211B"
  spent: "#9E9E9E"
  cell: "#E2E2E2"
  # Night (.dark): everything inverts
  ground-night: "#000000"
  panel-night: "#161616"
  inset-night: "#262626"
  rule-night: "#2C2C2C"
  rule-strong-night: "#575757"
  ink-night: "#FFFFFF"
  ink-2-night: "#ABABAB"
  ink-3-night: "#9C9C9C"
  shell-night: "#FFFFFF"
  shell-raised-night: "#E2E2E2"
  shell-ink-night: "#000000"
  forge-night: "#FFFFFF"
  forge-hover-night: "#E2E2E2"
  forge-ink-night: "#000000"
  danger-night: "#FF6B5B"
  cell-night: "#333333"
  # Skill categories (data/skill-colors.json; marks only, same in both modes)
  skill-attack: "#E5484D"
  skill-element: "#3E63DD"
  skill-utility: "#F5A524"
  skill-defense: "#30A46C"
  skill-resistance: "#8B8D98"
  # Driftstone swatches (identification only)
  stone-red: "#C8352B"
  stone-blue: "#2F5FC4"
  stone-black: "#23272B"
  stone-white: "#F2F2EE"
  stone-yellow: "#E3B521"
  stone-sky: "#38A9D6"
typography:
  display:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: 1.1
  headline:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 900
    lineHeight: 1.3
  title:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.35
  button:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
  numeral-large:
    fontFamily: "Inter, Noto Sans TC, ui-sans-serif, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  numeral:
    fontFamily: "Inter, Noto Sans TC, ui-sans-serif, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  numeral-inline:
    fontFamily: "Inter, Noto Sans TC, ui-sans-serif, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  wordmark:
    fontFamily: "Noto Sans TC, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  xs: "8px"
  sm: "12px"
  tile: "14px"
  plan: "16px"
  md: "20px"
  lg: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  card: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.forge}"
    textColor: "{colors.forge-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.forge-hover}"
  button-secondary:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 20px"
  button-secondary-hover:
    backgroundColor: "{colors.rule}"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  input-search:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 44px"
  chip:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
  chip-selected:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
  nav-tab:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-3}"
    height: "64px"
  nav-tab-active:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.ink}"
  sheet:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  toast:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  level-pip:
    backgroundColor: "{colors.cell}"
    rounded: "{rounded.pill}"
    width: "18px"
    height: "8px"
---

# Design System: 最強獵人 (The Strongest Hunter)

## Overview

**Creative North Star: "黑白野外工具 Black & White Field Kit"**

A build checked on a phone between hunts, outdoors, one-handed. The interface is a field kit rather than a dashboard: a white page (black at night) carrying a short stack of filled grey cards, every heading set heavy and large, every number set big and black. Nothing decorates; hierarchy comes from weight, size and whitespace, and the one action that matters on a screen is the single black pill.

Colour is withheld everywhere except one place: skill categories. Each skill's level is a row of rounded pips filled in its official category colour (attack red, element blue, action amber, defense green, resistance grey), so the skill board is the only colourful thing on a black-and-white screen and reads at a glance. Official equipment art and monster crests are the only imagery; they sit on soft filled tiles.

Motion is the app part of the kit: pages cross-fade through View Transitions, sheets and toasts rise on springs (motion-v), level pips pop in when gear changes, and everything animates through transform and opacity only. Loading shows skeletons, and saving or deleting a build updates the list at once.

It must not read as the retired Forge & Temper steel look, the old parchment look, a generic SaaS dashboard, a flashy game skin, or a knock-off of the in-game MHN interface.

**Key Characteristics:**
- White ground and filled grey cards by day; black ground and charcoal cards by night, everything inverted.
- One black pill per screen for the primary action; grey pills for everything else.
- Large radii: 20px cards, 28px sheets, fully round chips, pills and pips.
- Noto Sans TC 900 headings; Inter tabular figures for every number.
- Skill category colour only as level pips and small dots.
- Springs and cross-fades on transform/opacity; skeletons while loading.

## Colors

A pure neutral system with an inverse surface for action and selection, plus five category hues reserved for skill marks.

### Primary
- **Black Pill** (forge; white at night): the one primary action on a screen, such as 分享連結 on the build page, 開始搜尋 while the auto-build panel is open (分享連結 then drops to grey), 載入這組配裝 and 儲存 in their own views. Hover lifts to a soft charcoal (forge-hover).

### Secondary
- **Inverse Surface** (shell / shell-ink, inverted at night): every selected, filled or locked state: the selected filter chip, the selected target level, a filled driftstone socket, a locked slot, the applied auto-build plan, the active header nav pill, the icon disc on the auto-build card and weapon-type tiles, and the toast.

### Tertiary
- **Skill Category Hues** (skill-attack, skill-element, skill-utility, skill-defense, skill-resistance): level pips, the dot before a skill name, and the five-dot legend above the skill board. Per-skill overrides live in `data/skill-colors.json` for colours later picked from the game.
- **Danger** (danger / danger-night): a status, not data: 還差 (unmet levels), 超出上限 overflow counts, negative affinity, and the hover of destructive controls.

### Neutral
- **Ground** (ground): the page, the header, the tab bar, sheets, and art tiles inside cards.
- **Panel** (panel): every card and list container.
- **Inset** (inset): search fields, secondary pills, idle chips, row hover, art plates on white.
- **Rule** (rule): hairline list dividers and the header/tab-bar edges.
- **Strong Rule** (rule-strong): dashed borders for empty slots, empty sockets and the add-target button; the off switch track.
- **Ink** (ink, ink-2, ink-3): primary text; secondary text and labels; tertiary icons, chevrons and placeholders. All pass 4.5:1 on ground, panel and inset in both modes.
- **Unlit Pip** (cell): the empty level pip. **Spent** (spent): the hatched pip for levels past the max.
- **Driftstone Swatches** (stone-*): 12px rotated squares that identify a stone colour; prime stones are a hollow ink diamond.

### Named Rules
**The Category-Only Colour Rule.** Hue appears only to encode a skill's category: pips, dots, the legend. Never on buttons, borders, backgrounds, headings or icons.

**The One Black Pill Rule.** One filled primary per screen. A second action that competes is grey, and a primary that yields its role (分享連結 while auto-build is open) turns grey rather than doubling up.

**The Inverse Selection Rule.** Selected and on states invert to the shell surface; they are never shown with an accent tint.

## Typography

**Display Font:** Noto Sans TC (with ui-sans-serif, system-ui)
**Body Font:** Noto Sans TC
**Numeral Font:** Inter, tabular and lining figures (the `.stamp` class)

**Character:** A heavy CJK grotesque carries every heading through weight alone, and a clean Latin grotesque sets numbers in even columns, so levels, attack and percentages scan vertically.

### Hierarchy
- **Display** (900, 34px phone / 44px wide, 1.1): page titles (配裝, 武器, 技能); detail pages 28–40px.
- **Headline** (900, 22px, 1.3): section heads (裝備, 技能), sheet titles, card headings (26px for the first-visit intro).
- **Title** (700, 17px, 1.375): item names in cards and lists, card headers.
- **Body** (400, 15px, 1.55): descriptions, capped near 34–60em.
- **Label** (500, 12–13px): slot labels, status lines, stat captions, legends.
- **Numerals** (Inter 700–800): 28px plan coverage and detail stats (32px), 22px skill totals, 15px inline values.

### Named Rules
**The Weight-Not-Colour Rule.** Hierarchy comes from size and weight; never from coloured text.

**The Tabular Number Rule.** Every number uses the numeral face with tabular figures so values align in columns.

## Layout

Mobile-first at 375–428px with a 16px side gutter; cards inset from the screen edge rather than full-bleed. Wide screens centre the content: lists at 768px, the build page at 1024px in two columns (gear on the left, the sticky skill board in a 400px right column). The header is 56px (64px wide) with the wordmark, nav pills on wide screens, search and theme. Phones get a 64px bottom tab bar (配裝・防具・武器・技能・我的配裝) and, on the build page, an action dock pinned above it. Section rhythm: 32px above section heads, 12px below; cards 24px inner padding, list rows 14–16px. Search and filter chips stick under the header on list pages.

## Elevation & Depth

Flat. Depth is tonal: ground, then panel, then inset. Shadows exist only on things that float above the page: the sheet (`--sheet-shadow`), the toast (`--pop-shadow`), and the segmented-control thumb.

### Named Rules
**The Float-Only Shadow Rule.** A shadow means the element is temporarily above the page (sheet, toast, sliding thumb). Cards and buttons never cast one.

## Shapes

Generous, consistent rounding: 20px cards, 28px sheets (top corners on phones), 14–16px art tiles, plan cards and weapon-type tiles, 12px driftstone sockets, and fully round pills, chips, toggles, pips and nav indicators. Borders are rare: hairline dividers inside cards, and dashed 2px outlines to mean "empty, add something".

## Components

### Buttons
- **Shape:** fully round pills (9999px), 48px tall (44px small).
- **Primary:** black pill, white text (inverted at night).
- **Secondary:** grey inset pill, ink text; quiet text buttons (清除, 全部清除) are pill-shaped on hover only.
- **Press:** scales to 0.97 on press; colours switch instantly (no colour transitions).

### Chips
- **Style:** 40px round pills on inset grey.
- **State:** selected inverts to the shell surface with bold text.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** panel grey, no border, no shadow.
- **Internal Padding:** 16–24px; list rows inside are divided by hairlines.

### Inputs / Fields
- **Style:** 48px round search field on inset grey with a leading search icon and a clear button.
- **Focus:** a 2px ink ring.

### Navigation
- **Phones:** bottom tab bar on the ground colour with a hairline top; the active tab is ink and bold with its icon on an inset pill, inactive tabs are ink-3.
- **Wide screens:** header nav pills; the active page is an inverted pill.

### Skill Board (signature)
Rows of skill name, level pips and an Inter total ("5/5"). Pips are 18×8px round bars in the skill's category colour; empty pips are the unlit grey, overflow pips are hatched after a 1px stop. New pips pop in on a spring. Rows open to list the pieces that supply each skill.

### Sheet
Bottom sheet on phones (28px top corners, grab handle), centred card on wide screens; rises on a spring with a dimmed backdrop. Title 22px black weight with a round grey close button.

### Toast
A black pill floating above the dock with an optional inverted action (復原, 下載); springs in and out.

## Do's and Don'ts

### Do:
- **Do** keep each screen to one black pill; demote competing actions to grey pills.
- **Do** colour skills only through `skillColor()` (pips, dots, legend).
- **Do** set every number in the Inter `.stamp` style.
- **Do** animate with transform and opacity only, with springs for sheets, toasts and pips, and honour reduced motion.
- **Do** show skeletons while client-only data (saved builds, the current build) loads.

### Don't:
- **Don't** reintroduce the steel/forge palette, temper colours or the condensed stamped numerals.
- **Don't** add borders or shadows to cards, or nest cards inside cards.
- **Don't** use accent-coloured text, buttons or backgrounds.
- **Don't** transition colours, sizes or layout properties.

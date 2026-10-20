# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Monster Hunter Now (MHN) players who read Traditional Chinese. The primary scene is a phone in hand during the gaps between hunts — outdoors, walking, commuting — quickly composing or swapping a build and checking which skills it reaches. Sessions are short and interrupted; the screen must be readable at a glance.

## Product Purpose

最強獵人 (The Strongest Hunter) is an MHN build simulator. The player picks a weapon and five armor pieces, assigns driftstone skills to armor slots, and sees the resulting skill levels immediately. Auto-build searches equipment combinations for a set of target skills. Builds persist locally and can be shared as a URL.

Success: a player can go from "I want these skills" to a concrete, shareable build in one short phone session.

## Positioning

A Traditional-Chinese MHN builder where the build simulator, including auto-build with driftstone assignment and per-slot locks, is the product. The browsable weapon, armor, skill, and driftstone references exist to serve building, not as a standalone wiki.

## Operating Context

- Mobile-first (375–428px is the design target); desktop is supported but secondary.
- Used one-handed, in short interrupted sessions, often outdoors in daylight.
- Builds are shared by copying a URL (short query keys) to friends or groups.
- Deployed as a static site on GitHub Pages under `/mhn-builder/`; no backend.

## Capabilities and Constraints

- Routes: build simulator (the root forwards to it), weapons (type index → list → detail), armor (list → detail), skills with a 技能｜漂流石 switch (list → detail), 我的配裝 (saved builds); site-wide search in the header.
- Build state: weapon + head/chest/arms/waist/legs, per-armor driftstone slots (each contributes Lv1), URL params and localStorage persistence, share URL.
- Auto-build: target skills with levels, a weapon type (or a locked weapon), per-slot locks, a driftstone on/off switch, ranked results; runs in a Web Worker.
- Saved builds (我的配裝) live in this browser's localStorage with JSON export/import; any build or auto-build plan can be copied as a PNG card.
- Data is static JSON in `data/`; Nuxt 4 + Tailwind 4 + shadcn-nuxt + Pinia; `nuxt generate` for static output.
- Light and dark modes follow the system; the header switch overrides it and is remembered in the `mhn-theme-choice` cookie.
- Equipment data carries no rarity field. Weapon element type and value exist and are currently shown as text.

## Brand Commitments

- The name 「最強獵人」 stays; its typography and mark may be redesigned.
- Light/dark mode switching stays.
- Official game icons and equipment images (weapon-type SVGs, skill icons, armor/weapon webp images in `public/images/`) stay as the content imagery.
- The interface must not imitate or knock off the in-game MHN UI.

## Evidence on Hand

- Full equipment, skill, driftstone, and material data in `data/`.
- Equipment, monster, skill, and weapon-type images in `public/images/`.
- No user counts, testimonials, or rankings exist; none may be invented.

## Product Principles

1. The build is the protagonist: every surface should lead toward composing, checking, or sharing a build.
2. Glanceable on a phone: skill outcomes and missing pieces readable in one look, outdoors, one-handed.
3. Density without strain: show real numbers and skill levels plainly; no decoration that costs reading speed.
4. Its own identity: recognizably a hunting tool, but neither a generic dashboard nor a copy of the game's UI.

## Accessibility & Inclusion

Text contrast at least WCAG 2.2 AA (4.5:1) in both themes; touch targets at least 44px; respect `prefers-reduced-motion`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mhn-builder** is a Monster Hunter Now (MHN) build simulator web app called "最強獵人" (The Strongest Hunter). It lets players browse armor/weapons, compose equipment sets, assign driftstone skills, and auto-generate optimized builds.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run generate   # Static site generation
npm run preview    # Preview production build
npm run sync:data      # Re-fetch official data and rewrite data/ (see "Data Sync"; `-- --help` for flags)
npm run validate:data  # Check data/ invariants and referenced images (exit 1 on errors)
npm test               # Vitest unit tests for the pure logic in app/lib (tests/)
```

No lint script is configured — TypeScript type-checking is via Nuxt's built-in integration. Tests cover `app/lib/` only; UI is verified in the browser. Run `validate:data` after editing anything in `data/`. The plan for the ongoing redesign and features lives in `docs/roadmap.md`.

## Tech Stack

- **Nuxt 4** (Vue 3, file-based routing under `app/pages/`)
- **Tailwind CSS 4** (via `@tailwindcss/vite` plugin, configured in `assets/css/tailwind.css`)
- **shadcn-nuxt** (components in `components/ui/`, style: "new-york", icons: Lucide)
- **Pinia** for state management
- **TypeScript** throughout

## Architecture

### Directory Layout

```
app/
  pages/          # File-based routes
  components/     # Feature + UI components (ui/ = shadcn auto-generated)
  stores/         # Pinia stores
  lib/            # Pure TS logic (no Vue/Pinia)
  composables/    # Vue composables
  layouts/        # Nuxt layout templates
data/
  armor/          # Per-slot JSON: head, chest, arms, waist, legs
  weapons/        # Per-weapon-type JSON (14 weapon types)
  skills.json
  driftstone-skills.json
  armor-monsters.json  # Armor id prefix -> set icon key (public/images/monsters/<key>.webp)
  monsters.json        # Official monsters (names, crest icon, hand-kept search aliases) + armor set / weapon -> monster links
  materials.json       # Hand-maintained, not synced (unused by the UI)
scripts/
  sync/           # Official data sync (`npm run sync:data`), zero-dependency Node ESM
  validate-data.mjs  # Data validator (`npm run validate:data`), also used by the sync
  test-armor-ui.py   # Ad-hoc Playwright check of the armor pages
```

### Pages (routes)

| Route | Purpose |
|---|---|
| `/` | Forwards to `/build` (meta refresh + client redirect) |
| `/armor` | Armor browser |
| `/armor/[slug]` | Armor detail |
| `/weapons` | Weapon type index |
| `/weapons/[type]` | Weapon list by type |
| `/weapons/[type]/[slug]` | Weapon detail |
| `/skills` | Skill reference; `?tab=driftstones` shows the driftstone browser |
| `/skills/[slug]` | Skill detail |
| `/driftstones` | Forwards to `/skills?tab=driftstones` |
| `/build` | Build simulator (empty state doubles as the intro) |
| `/my-builds` | 我的配裝: saved builds in localStorage, export/import |

### Pinia Stores

- **`useBuildStore`** (`stores/build.ts`) — Central build state: selected weapon + 5 armor slots + per-slot driftstone skills. Handles URL serialization (short param keys: `w`, `h`, `c`, `a`, `wa`, `l` for equipment; `dh`, `dc`, `da`, `dw`, `dl` for driftstones), localStorage persistence (`mhn-builder-current-build`), and build sharing via `toShareUrl()`.
- **`useEquipmentStore`** (`stores/equipment.ts`) — Loads and indexes all armor/weapon data from `/data` JSON files.
- **`useSkillStore`** (`stores/skill.ts`) — Skill metadata lookup.
- **`useAutoBuildStore`** (`stores/autoBuild.ts`) — Drives the auto-build UI (target skills, weapon type, locks, driftstone switch; settings persisted in `mhn-builder-auto-build`), runs the algorithm in `lib/autoBuild.worker.ts`.
- **`useSavedBuildsStore`** (`stores/savedBuilds.ts`) — 我的配裝 (`mhn-builder-saved-builds`, max 50), logic in `lib/savedBuilds.ts`.
- **`useMaterialStore`** (`stores/material.ts`) — Material data.

### Auto-Build Algorithm (`app/lib/autoBuildAlgorithm.ts`)

Pure TypeScript (no Vue/Pinia). Strategy: K=8 greedy filter per armor slot and for the weapon (within one weapon type, or the locked weapon) → enumerate all combos (K^6 ≈ 262k max) → score by skill coverage/shortage/overflow → optionally greedy-assign driftstone slots → rank by skill score, then attack, then defense → top-N. Covered by `tests/autoBuildAlgorithm.test.ts`.

### Visual system

`DESIGN.md` (with `.impeccable/design.json`) is the source of truth: black/white field kit, one black pill per screen, Noto Sans TC 900 headings, Inter numerals (`.stamp`), skill category colours only on level pips/dots (`lib/skillColors.ts`, `data/skill-colors.json` for per-skill overrides), motion on transform/opacity only (motion-v springs, View Transitions). Shared pieces: `.btn` / `.btn-primary` / `.btn-secondary` / `.card` in `assets/css/tailwind.css`, `SheetDialog`, `AppToast` + `useToast()`, `FilterTabs`, `ScrollStrip` (every sideways-scrolling row: wheel + edge arrows for mouse users), `SegmentedControl`, `TemperBar` (level pips).

### Data Schema

Armor pieces (e.g., `data/armor/head.json`) contain: `id`, `name`, `nameEn`, `setName`, `setNameEn`, `part`, `defense` (grade 10 Lv5), `skills: [{skillId, level}]`, `driftstoneSlots`, `image`. Weapons (`data/weapons/<type>.json`) have `id`, names, `type`, grade 10 Lv5 `attack`/`element`/`affinity`, `spSkill`, `skills` (a skill may carry `requiredCustomEnhancementLevel`), `image` and type-specific fields; they keep the grade-1 name and image. `validate-data.mjs` holds the canonical field order of every record type.

### Data Sync (`scripts/sync/`)

`npm run sync:data` makes `data/` match the official site https://monsterhunternow.com:

- **Source** — the list pages `/zh|en/skills`, `/zh|en/armor`, `/zh|en/weapons` embed the whole dataset as JSON in a `<root-island component="..." props="...">` tag; weapon detail pages `/zh/weapons/<id>` add the strings the island does not translate. This is undocumented markup, so every parser fails loudly instead of guessing.
- **Flow** (`index.mjs`) — `skills.mjs` first (assigns ids for new skill kinds), then `armor.mjs` + `weapons.mjs` in parallel → cross-checks (same skills dict on every page, no >10% record drop unless `--allow-shrink`) → download new images → run `validateData()` on a temp copy of `data/` → only then write `data/` and the id maps. Any failure exits 1 with `data/` untouched. `--dry-run` writes nothing; `--report FILE` writes the Markdown report; `--cache-dir DIR` caches pages for fast local re-runs.
- **Ids are permanent** — they live in share URLs and localStorage. `config/id-maps.json` (official skill slug → `skills.json` id, official armor set key → armor id prefix, excluded skill kinds) is append-only: new official keys get a default id (underscores → hyphens) and are flagged in the report under 需要人工確認. Never rename or remove an entry.
- **Keep-missing policy** — records that disappear upstream are kept unchanged and listed in the report; existing records keep their position and new ones are appended in official order.
- **`config/extra-gear.json`** — hand-entered event gear the official site does not list (Guardian, New Year, …). Records use the normal armor/weapon fields plus `source: "manual"`, ids `ev-…` (armor) / `ev_…` (weapons), and may point `image` at any existing `/images/**.webp`. The sync appends them after the official records and replaces earlier manual records wholesale (removing one from the config removes it from `data/`); the report flags manual gear that the official site now lists by the same name. The UI marks them 非官方資料. Changes reach `data/` on the next `npm run sync:data`.
- **`config/overrides.json`** — manual field corrections applied on top of official data (`{ dataset: { id: { field: value } } }`). Official data wins everywhere else — e.g. `skills.json` `description` is generated from the official level text (Lv1～max ranges, or the Lv1 text when the wording changes between levels).
- **`data/armor-monsters.json`** — new sets get an entry (icon = the set's chest image); `leather`/`alloy` icons are hand-picked.
- **`data/monsters.json`** (`monsters.mjs`) — built from the `monsters` object both list islands embed: names, crest (`public/images/monster-crests/<id>.webp`), and armor set / weapon links via each record's official `series` (`SERIES_<MONSTERID>`; material series such as ore/bone have no monster). `aliases` is hand-maintained (search nicknames) and preserved across syncs.

### Search (`app/lib/search.ts`, `app/lib/monsters.ts`)

Every list filter and the header's site search (`SiteSearch.vue`, also opened with `/`) share `searchList()`: whitespace tokens, each must be a substring of the record's name or one of its other terms (English name, set name, and its monster's names/aliases), width/case folded. List pages keep the query in `?q=` via `useQuerySearch()`.
- **Weekly Action** (`.github/workflows/sync-data.yml`) — Mondays 09:23 Asia/Taipei + manual dispatch: sync, `validate:data`, `npm run generate`, then opens/updates one PR `chore/data-sync` → `main` with the report as its body. It never pushes to `main`; merging the PR deploys. Each run rebuilds `chore/data-sync` from `main` and force-pushes it, so hand edits go on `main` (normally into `config/overrides.json`), never onto that branch. If the open PR has commits the workflow did not make, the run fails before the PR step rather than dropping them.

## Key Conventions

- **Composition API only** — all Vue components use `<script setup>`.
- **`~/`** alias maps to `app/` (Nuxt 4 convention with `app/` source directory).
- **Data is static JSON** — no backend or API calls; all data lives in `data/`.
- **Build state hydration** — `useBuildStore.hydrate()` must be called on the build page to load equipment stores, then restore state from URL params (takes priority) or localStorage. `deserialize()` drops restored driftstone skills that are not in `achievableSkillIds` and truncates each slot to the armor's `driftstoneSlots`, so old builds survive data syncs.
- Driftstone skills always contribute **Lv1** per slot regardless of the underlying skill's max level.
- **Never hand-edit synced fields in `data/`** — the next sync overwrites them; use `scripts/sync/config/overrides.json` instead.

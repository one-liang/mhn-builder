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
```

No test or lint scripts are configured — TypeScript type-checking is via Nuxt's built-in integration. `validate:data` is the closest thing to a data test; run it after editing anything in `data/`.

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
  materials.json       # Hand-maintained, not synced (unused by the UI)
scripts/
  sync/           # Official data sync (`npm run sync:data`), zero-dependency Node ESM
  validate-data.mjs  # Data validator (`npm run validate:data`), also used by the sync
  test-armor-ui.py   # Ad-hoc Playwright check of the armor pages
```

### Pages (routes)

| Route | Purpose |
|---|---|
| `/` | Home |
| `/armor` | Armor browser |
| `/armor/[slug]` | Armor detail |
| `/weapons` | Weapon type index |
| `/weapons/[type]` | Weapon list by type |
| `/weapons/[type]/[slug]` | Weapon detail |
| `/skills` | Skill reference |
| `/skills/[slug]` | Skill detail |
| `/driftstones` | Driftstone skill browser |
| `/build` | Build simulator |

### Pinia Stores

- **`useBuildStore`** (`stores/build.ts`) — Central build state: selected weapon + 5 armor slots + per-slot driftstone skills. Handles URL serialization (short param keys: `w`, `h`, `c`, `a`, `wa`, `l` for equipment; `dh`, `dc`, `da`, `dw`, `dl` for driftstones), localStorage persistence (`mhn-builder-current-build`), and build sharing via `toShareUrl()`.
- **`useEquipmentStore`** (`stores/equipment.ts`) — Loads and indexes all armor/weapon data from `/data` JSON files.
- **`useSkillStore`** (`stores/skill.ts`) — Skill metadata lookup.
- **`useAutoBuildStore`** (`stores/autoBuild.ts`) — Drives the auto-build UI, delegates to the algorithm.
- **`useMaterialStore`** (`stores/material.ts`) — Material data.

### Auto-Build Algorithm (`app/lib/autoBuildAlgorithm.ts`)

Pure TypeScript (no Vue/Pinia). Strategy: K=8 greedy filter per armor slot → enumerate all K^5 combos (~32,768 max) → score by skill coverage/shortage/overflow → optionally greedy-assign driftstone slots → return top-N results.

### Data Schema

Armor pieces (e.g., `data/armor/head.json`) contain: `id`, `name`, `nameEn`, `setName`, `setNameEn`, `part`, `defense` (grade 10 Lv5), `skills: [{skillId, level}]`, `driftstoneSlots`, `image`. Weapons (`data/weapons/<type>.json`) have `id`, names, `type`, grade 10 Lv5 `attack`/`element`/`affinity`, `spSkill`, `skills` (a skill may carry `requiredCustomEnhancementLevel`), `image` and type-specific fields; they keep the grade-1 name and image. `validate-data.mjs` holds the canonical field order of every record type.

### Data Sync (`scripts/sync/`)

`npm run sync:data` makes `data/` match the official site https://monsterhunternow.com:

- **Source** — the list pages `/zh|en/skills`, `/zh|en/armor`, `/zh|en/weapons` embed the whole dataset as JSON in a `<root-island component="..." props="...">` tag; weapon detail pages `/zh/weapons/<id>` add the strings the island does not translate. This is undocumented markup, so every parser fails loudly instead of guessing.
- **Flow** (`index.mjs`) — `skills.mjs` first (assigns ids for new skill kinds), then `armor.mjs` + `weapons.mjs` in parallel → cross-checks (same skills dict on every page, no >10% record drop unless `--allow-shrink`) → download new images → run `validateData()` on a temp copy of `data/` → only then write `data/` and the id maps. Any failure exits 1 with `data/` untouched. `--dry-run` writes nothing; `--report FILE` writes the Markdown report; `--cache-dir DIR` caches pages for fast local re-runs.
- **Ids are permanent** — they live in share URLs and localStorage. `config/id-maps.json` (official skill slug → `skills.json` id, official armor set key → armor id prefix, excluded skill kinds) is append-only: new official keys get a default id (underscores → hyphens) and are flagged in the report under 需要人工確認. Never rename or remove an entry.
- **Keep-missing policy** — records that disappear upstream are kept unchanged and listed in the report; existing records keep their position and new ones are appended in official order.
- **`config/overrides.json`** — manual field corrections applied on top of official data (`{ dataset: { id: { field: value } } }`); `skills.json` `description` is hand-written and always preserved.
- **`data/armor-monsters.json`** — new sets get an entry (icon = the set's chest image); `leather`/`alloy` icons are hand-picked.
- **Weekly Action** (`.github/workflows/sync-data.yml`) — Mondays 09:23 Asia/Taipei + manual dispatch: sync, `validate:data`, `npm run generate`, then opens/updates one PR `chore/data-sync` → `main` with the report as its body. It never pushes to `main`; merging the PR deploys. Each run rebuilds `chore/data-sync` from `main` and force-pushes it, so hand edits (e.g. skill descriptions) go on `main` after merging, or into `config/overrides.json` on `main`, never onto that branch. If the open PR has commits the workflow did not make, the run fails before the PR step rather than dropping them.

## Key Conventions

- **Composition API only** — all Vue components use `<script setup>`.
- **`~/`** alias maps to `app/` (Nuxt 4 convention with `app/` source directory).
- **Data is static JSON** — no backend or API calls; all data lives in `data/`.
- **Build state hydration** — `useBuildStore.hydrate()` must be called on the build page to load equipment stores, then restore state from URL params (takes priority) or localStorage. `deserialize()` drops restored driftstone skills that are not in `achievableSkillIds` and truncates each slot to the armor's `driftstoneSlots`, so old builds survive data syncs.
- Driftstone skills always contribute **Lv1** per slot regardless of the underlying skill's max level.
- **Never hand-edit synced fields in `data/`** — the next sync overwrites them; use `scripts/sync/config/overrides.json` instead.

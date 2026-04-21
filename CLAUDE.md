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
```

No test or lint scripts are configured — TypeScript type-checking is via Nuxt's built-in integration.

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
  materials.json
scripts/          # Utility/scraping scripts for data maintenance
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

Armor pieces (e.g., `data/armor/head.json`) contain: `id`, `name`, `rarity`, `defense`, `skills: [{skillId, level}]`, image URL, and driftstone slot count. Weapons follow a similar schema with type-specific stats.

## Key Conventions

- **Composition API only** — all Vue components use `<script setup>`.
- **`~/`** alias maps to `app/` (Nuxt 4 convention with `app/` source directory).
- **Data is static JSON** — no backend or API calls; all data lives in `data/`.
- **Build state hydration** — `useBuildStore.hydrate()` must be called on the build page to load equipment stores, then restore state from URL params (takes priority) or localStorage.
- Driftstone skills always contribute **Lv1** per slot regardless of the underlying skill's max level.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mid-to-heavy Monster Hunter Now players in Taiwan who read Traditional Chinese. They use the site mostly on their phones, in short sessions: between hunts or before a fight, to look up a piece of equipment, put together or adjust a build, and send it to friends.

## Product Purpose

最強獵人 (The Strongest Hunter) is a build simulator for Monster Hunter Now. It puts every weapon, armor piece, skill, and driftstone skill in one searchable reference, lets players combine a weapon with five armor slots and driftstone skills while skill totals update live, and generates optimized builds automatically. Success means a player gets from "what should I wear for this hunt?" to a build they can use and share in one quick phone session.

## Positioning

- Complete equipment, skill, and driftstone data in Traditional Chinese.
- Auto-build: the player picks target skills and the tool searches armor combinations, optionally assigning driftstones, and ranks the results.
- Builds live entirely in the URL, so sharing needs no account or login.
- Mobile-first web app with nothing to install; open the link and use it.

## Operating Context

- Used on a phone next to the game, often one-handed, in brief sessions; desktop is secondary.
- Builds travel as shared links in chats and communities.
- The last build is restored from browser storage on return visits.

## Capabilities and Constraints

- Routes: home, weapon index / weapon type list / weapon detail, armor list / detail, skills list / detail, driftstones, and build simulator (`/build`).
- All game data is static JSON in `data/`; equipment images are in `public/images/`.
- Driftstone skills always count as Lv1 per slot, whatever the skill's max level.
- Currently deployed as a static site on GitHub Pages with no backend. The user did not make this a binding constraint.
- Undecided: whether the product stays free and ad-free (not confirmed either way).

## Brand Commitments

- The product name 「最強獵人」 and its established Traditional Chinese terms (配裝, 漂流石, 防具, 武器, 技能) stay as they are.
- Unofficial fan-made tool: never use Capcom or Niantic official logos or branding, and never present the site as official.

## Evidence on Hand

- Game data: `data/armor/`, `data/weapons/`, `data/skills.json`, `data/driftstone-skills.json`, `data/materials.json`.
- Images: `public/images/` (armor, weapons, weapon types, skills, monsters).
- No testimonials, usage numbers, or press exist; do not invent any.

## Product Principles

1. **Fast on the phone.** A lookup or a build tweak should take seconds, one-handed, mid-session.
2. **Data is the product.** Accurate, complete Traditional Chinese game data comes before any decoration.
3. **Share by link.** Every build should be reproducible from its URL alone, with no account.
4. **Let the tool do the math.** Auto-build and live skill totals take the arithmetic off the player.
5. **Fan-made, honestly.** Feel at home in the game's world without claiming to be official.

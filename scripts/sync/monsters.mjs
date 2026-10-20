/**
 * Monster sync: the "monsters" object both list islands embed, plus each armor
 * piece's and weapon's official series -> data/monsters.json
 *
 *   {
 *     monsters:  [{ id, name, nameEn, aliases, icon }]   official order (sortOrder)
 *     armorSets: { <armor id prefix>: <monster id> }
 *     weapons:   { <weapon id>: <monster id> }
 *   }
 *
 * A series belongs to a monster when SERIES_<X> names its id (SERIES_SILVERRATHALOS ->
 * silverrathalos); ore, bone, alloy and other material series have no monster.
 * `aliases` is hand-maintained (search nicknames such as 銀火) and kept as is.
 * Keep-missing policy as elsewhere: monsters and links that vanish upstream stay.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, jsonEqual } from './lib/io.mjs'

// fieldIconUrl + this suffix returns a 128x128 lossless WebP crest.
const IMAGE_SUFFIX = '=s128-rw'
const MONSTER_ID = /^[a-z0-9]+$/

export const MONSTER_FIELDS = ['id', 'name', 'nameEn', 'aliases', 'icon']

/** "SERIES_SILVERRATHALOS" -> "silverrathalos" */
const seriesKey = series => String(series ?? '').replace(/^SERIES_/, '').toLowerCase()

/**
 * @param ctx.current    loadData() result (current.monsters may be the empty default)
 * @param ctx.armor      armor result's monsterInput: { monsters, zhT, enT, sets: [prefix, series][] }
 * @param ctx.weapons    weapons result's monsterInput: { weaponSeries: [id, series][] }
 */
export function syncMonsters({ current, armor, weapons, log = () => {} }) {
  const warnings = []
  const cur = current.monsters
  const curById = new Map(cur.monsters.map(m => [m.id, m]))

  const officialList = Object.values(armor.monsters ?? {})
  if (!officialList.length) throw new Error('monsters: armor island has no "monsters" object')
  officialList.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const official = []
  const images = []
  for (const m of officialList) {
    const id = String(m.id)
    if (!MONSTER_ID.test(id)) throw new Error(`monsters: official monster id "${id}" is not lowercase alphanumeric`)
    const key = `MONSTER_NAME_${id.toUpperCase()}`
    const record = {
      id,
      name: armor.zhT(key),
      nameEn: armor.enT(key),
      aliases: curById.get(id)?.aliases ?? [],
      icon: `/images/monster-crests/${id}.webp`,
    }
    if (!record.name) throw new Error(`monsters: ${id} has no zh name (${key})`)
    official.push(record)
    const dest = `public${record.icon}`
    if (!existsSync(join(ROOT, dest))) {
      if (typeof m.fieldIconUrl === 'string' && /^https:\/\//.test(m.fieldIconUrl)) {
        images.push({ url: m.fieldIconUrl + IMAGE_SUFFIX, dest, label: `monster crest ${id} ${record.name}` })
      } else {
        warnings.push(`monster ${id} has no fieldIconUrl; ${dest} is missing`)
      }
    }
  }

  // Official order first, then monsters kept from before that the site dropped
  const officialIds = new Set(official.map(m => m.id))
  const keptMissingUpstream = cur.monsters.filter(m => !officialIds.has(m.id))
  const monsters = [...official, ...keptMissingUpstream]
  const known = new Set(monsters.map(m => m.id))

  const added = official.filter(m => !curById.has(m.id)).map(m => `${m.id} ${m.name}`)
  const changed = []
  for (const m of official) {
    const before = curById.get(m.id)
    if (!before) continue
    for (const field of MONSTER_FIELDS) {
      if (!jsonEqual(before[field], m[field])) changed.push({ id: m.id, name: m.name, field, from: before[field], to: m[field] })
    }
  }

  /** Merge official links over the current ones; returns the map and the series with no monster. */
  function link(pairs, currentMap) {
    const map = { ...currentMap }
    const unlinked = new Map()
    for (const [key, series] of pairs) {
      const monster = seriesKey(series)
      if (known.has(monster)) map[key] = monster
      else unlinked.set(series, (unlinked.get(series) ?? 0) + 1)
    }
    return { map, unlinked }
  }
  const armorSets = link(armor.sets, cur.armorSets)
  const weaponLinks = link(weapons.weaponSeries, cur.weapons)

  const summary = [
    `${official.length} official monsters (current ${cur.monsters.length}): ${added.length} added, ${new Set(changed.map(c => c.id)).size} changed, ${keptMissingUpstream.length} kept (missing upstream)`,
    `links: ${Object.keys(armorSets.map).length} armor sets, ${Object.keys(weaponLinks.map).length} weapons`,
  ]
  const unlinked = new Map([...armorSets.unlinked])
  for (const [s, n] of weaponLinks.unlinked) unlinked.set(s, (unlinked.get(s) ?? 0) + n)
  if (unlinked.size) {
    summary.push(`series without a monster (no crest, not searchable by monster): ${[...unlinked].map(([s, n]) => `${seriesKey(s)} ×${n}`).join(', ')}`)
  }
  if (images.length) summary.push(`${images.length} crests to download`)
  log(`monsters: ${summary.join('; ')}`)

  return {
    name: 'monsters',
    files: [{ path: 'data/monsters.json', data: { monsters, armorSets: armorSets.map, weapons: weaponLinks.map } }],
    images,
    counts: { official: official.length, current: cur.monsters.length },
    report: {
      summary,
      added,
      changed,
      keptMissingUpstream: keptMissingUpstream.map(m => `${m.id} ${m.name}`),
      newIds: [],
      overridesApplied: [],
      warnings,
    },
  }
}

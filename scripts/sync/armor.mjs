/**
 * Armor sync: /zh/armor + /en/armor island "SortableArmorList"
 *   -> data/armor/{head,chest,arms,waist,legs}.json and data/armor-monsters.json
 *
 * Each list page embeds every armor piece with all grades; the zh and en pages
 * carry identical numbers and differ only in guideTranslations, so two
 * requests cover the whole dataset.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { applyOverrides, mergeRecords } from './lib/diff.mjs'
import { extractIsland, stripGradeSuffix, translator } from './lib/html.mjs'
import { ARMOR_PARTS, ROOT, jsonEqual } from './lib/io.mjs'

const ISLAND = 'SortableArmorList'

// Official category -> part file. The waist category is "TORSO" although the
// official id still ends in _WAIST.
const CATEGORY_TO_PART = { HEAD: 'head', CHEST: 'chest', ARMS: 'arms', TORSO: 'waist', LEGS: 'legs' }
const ID_SUFFIX_TO_PART = { HEAD: 'head', CHEST: 'chest', ARMS: 'arms', WAIST: 'waist', LEGS: 'legs' }

// Google CDN base URL + this suffix returns the 128x128 lossless WebP that the
// existing public/images files were saved from (byte-identical).
const IMAGE_SUFFIX = '=s128-rw'

const SHRINK_RATIO = 0.9

/** Official id "CORAL_PUKEIPUKEI_HEAD" -> { setKey: 'coral_pukeipukei', idPart: 'head' } */
function splitOfficialId(officialId) {
  const m = /^(.+)_(HEAD|CHEST|ARMS|WAIST|LEGS)$/.exec(officialId)
  if (!m) throw new Error(`armor: official id "${officialId}" has no _HEAD/_CHEST/_ARMS/_WAIST/_LEGS suffix`)
  return { setKey: m[1].toLowerCase(), idPart: ID_SUFFIX_TO_PART[m[2]] }
}

function assertImageUrl(url, officialId) {
  if (typeof url !== 'string' || !/^https:\/\/[^\s"]+$/.test(url)) {
    throw new Error(`armor: ${officialId} has no usable mImageUrl (${JSON.stringify(url)})`)
  }
}

export async function syncArmor(ctx) {
  const { http, current, maps, skillIds, overrides = {}, log = () => {}, options = {} } = ctx
  const warnings = []
  const newIds = []

  log('armor: fetching /zh/armor and /en/armor')
  const [zhHtml, enHtml] = await http.map(['/zh/armor', '/en/armor'], path => http.getText(path))
  const zh = extractIsland(zhHtml, ISLAND)
  const en = extractIsland(enHtml, ISLAND)
  for (const [label, props] of [['zh', zh], ['en', en]]) {
    if (!props.armor || typeof props.armor !== 'object') throw new Error(`armor: ${label} island has no "armor" object`)
    if (!props.skills || typeof props.skills !== 'object') throw new Error(`armor: ${label} island has no "skills" object`)
  }

  const zhIds = Object.keys(zh.armor)
  const enIds = new Set(Object.keys(en.armor))
  const onlyZh = zhIds.filter(id => !enIds.has(id))
  const onlyEn = [...enIds].filter(id => !(id in zh.armor))
  if (onlyZh.length || onlyEn.length) {
    throw new Error(`armor: zh/en armor id sets differ (zh only: ${onlyZh.join(', ') || '-'}; en only: ${onlyEn.join(', ') || '-'})`)
  }
  if (!jsonEqual(zh.armor, en.armor)) warnings.push('zh and en armor data differ beyond translations (site deployed between requests?); zh values were used')

  const zhT = translator(zh, 'zh/armor')
  const enT = translator(en, 'en/armor')

  // --- build official records (official order) ---
  const prefixOwner = new Map(Object.entries(maps.armorSetPrefix).map(([setKey, prefix]) => [prefix, setKey]))
  const sets = new Map() // setKey -> { prefix, setName, pieces: { part: officialArmor } }
  const official = []
  const seen = new Set()

  for (const a of Object.values(zh.armor)) {
    const part = CATEGORY_TO_PART[a.category]
    if (!part) throw new Error(`armor: ${a.id} has unknown category "${a.category}"`)
    const { setKey, idPart } = splitOfficialId(a.id)
    if (idPart !== part) throw new Error(`armor: ${a.id} has category ${a.category} but its id names part "${idPart}"`)

    let prefix = maps.armorSetPrefix[setKey]
    if (!prefix) {
      prefix = setKey.replace(/_/g, '-')
      if (prefixOwner.has(prefix)) {
        throw new Error(`armor: default prefix "${prefix}" for new set ${setKey} collides with set ${prefixOwner.get(prefix)}; add an explicit armorSetPrefix entry to config/id-maps.json`)
      }
      maps.armorSetPrefix[setKey] = prefix
      prefixOwner.set(prefix, setKey)
      const series = `SERIES_NAME_${a.seriesId}`
      newIds.push(`armor set prefix "${prefix}" (official set ${setKey}, ${zhT(series)} / ${enT(series)})`)
    }
    const id = `${prefix}-${part}`
    if (seen.has(id)) throw new Error(`armor: duplicate id ${id} (official ${a.id})`)
    seen.add(id)

    if (!Array.isArray(a.grades) || !a.grades.length) throw new Error(`armor: ${a.id} has no grades`)
    const grades = [...a.grades].sort((x, y) => x.grade - y.grade)
    const first = grades[0]
    const last = grades.at(-1)
    if (last.grade !== 10) throw new Error(`armor: ${a.id} tops out at grade ${last.grade}, expected 10`)

    // Defense: grade 10 Lv5, the value the UI labels 防禦力（滿級）.
    const defense = last.defense?.at(-1)
    if (!Number.isInteger(defense) || defense <= 0) throw new Error(`armor: ${a.id} has invalid grade-10 defense ${JSON.stringify(last.defense)}`)
    const driftstoneSlots = last.driftsmeltSlots
    if (!Number.isInteger(driftstoneSlots) || driftstoneSlots < 0) throw new Error(`armor: ${a.id} has invalid driftsmeltSlots ${driftstoneSlots}`)

    // Skills of the final grade (skills only ever grow with grade), ordered by
    // unlock grade and then in-grade position, as the detail page lists them.
    const firstSeen = new Map()
    grades.forEach((g, gi) => g.skills.forEach((s, si) => {
      if (!firstSeen.has(s.kind)) firstSeen.set(s.kind, gi * 1000 + si)
    }))
    const kinds = new Set()
    const skills = [...last.skills]
      .sort((x, y) => firstSeen.get(x.kind) - firstSeen.get(y.kind))
      .map(s => {
        if (kinds.has(s.kind)) throw new Error(`armor: ${a.id} lists skill ${s.kind} twice`)
        kinds.add(s.kind)
        if (!Number.isInteger(s.level) || s.level < 1) throw new Error(`armor: ${a.id} skill ${s.kind} has invalid level ${s.level}`)
        return { skillId: skillIds.resolve(s.kind, `armor ${a.id}`), level: s.level }
      })

    assertImageUrl(a.mImageUrl, a.id)
    const seriesKey = `SERIES_NAME_${a.seriesId}`
    const record = {
      id,
      name: stripGradeSuffix(zhT(first.name)),
      nameEn: stripGradeSuffix(enT(first.name)),
      setName: zhT(seriesKey).replace(/\s*系列$/, ''),
      setNameEn: enT(seriesKey).replace(/\s+Set$/, ''),
      part,
      defense,
      skills,
      driftstoneSlots,
      image: `/images/armor/${id}.webp`,
    }
    if (!record.name) throw new Error(`armor: ${a.id} has an empty zh name`)
    official.push({ record, source: a })

    if (!sets.has(setKey)) sets.set(setKey, { prefix, setName: record.setName, pieces: {} })
    sets.get(setKey).pieces[part] = a
  }

  // --- guards ---
  const currentTotal = ARMOR_PARTS.reduce((n, p) => n + current.armor[p].length, 0)
  if (official.length < currentTotal * SHRINK_RATIO && !options.allowShrink) {
    throw new Error(`armor: official site lists ${official.length} pieces but data/armor has ${currentTotal} (< ${SHRINK_RATIO * 100}%); re-run with --allow-shrink if this is expected`)
  }

  const officialRecords = official.map(o => o.record)
  const overridesApplied = applyOverrides(officialRecords, overrides.armor)

  // --- merge per part file ---
  const files = []
  const added = []
  const changed = []
  const keptMissingUpstream = []
  for (const part of ARMOR_PARTS) {
    const merged = mergeRecords(current.armor[part], officialRecords.filter(r => r.part === part))
    files.push({ path: `data/armor/${part}.json`, data: merged.list })
    added.push(...merged.added.map(r => `${r.id} ${r.name}`))
    changed.push(...merged.changed)
    keptMissingUpstream.push(...merged.keptMissingUpstream.map(r => `${r.id} ${r.name}`))
  }

  // --- images for pieces that have no file yet ---
  const images = []
  for (const { record, source } of official) {
    const dest = `public/images/armor/${record.id}.webp`
    if (!existsSync(join(ROOT, dest))) {
      images.push({ url: source.mImageUrl + IMAGE_SUFFIX, dest, label: `armor ${record.id} ${record.name}` })
    }
  }

  // --- set icons: data/armor-monsters.json (armor id prefix -> icon key) ---
  // The icon file is public/images/monsters/<key>.webp. Despite the folder name,
  // the existing official icons are each set's CHEST piece image, not a monster
  // crest: the legacy download-monster-icons.py took the first 80px image on
  // /zh/armor/<setKey>_head, which is the chest in the 成套防具 list, and all 64
  // non-leather/alloy icons are sha1-identical to <chest>.mImageUrl + '=s128-rw'
  // (props.monsters[*].fieldIconUrl is the real crest, a different image).
  // New sets use the same source so every set looks alike. Icon key convention:
  // the official set key (ore, coral_pukeipukei, stygian_zinogre), which is what
  // every existing entry uses. leather/alloy keep their hand-picked files.
  const armorMonsters = { ...current.armorMonsters }
  const usedIconKeys = new Set(Object.values(armorMonsters))
  const iconAdded = []
  for (const [setKey, set] of sets) {
    const chest = set.pieces.chest
    let key = armorMonsters[set.prefix]
    if (!key) {
      if (!chest) {
        warnings.push(`set ${set.prefix} (${setKey}) has no chest piece to use as its icon; no armor-monsters.json entry added`)
        continue
      }
      if (usedIconKeys.has(setKey)) {
        warnings.push(`icon key "${setKey}" for set ${set.prefix} is already used by another set; no armor-monsters.json entry added`)
        continue
      }
      key = setKey
      armorMonsters[set.prefix] = key
      usedIconKeys.add(key)
      iconAdded.push(`${set.prefix} → ${key}`)
    }
    const dest = `public/images/monsters/${key}.webp`
    if (!existsSync(join(ROOT, dest))) {
      if (chest) images.push({ url: chest.mImageUrl + IMAGE_SUFFIX, dest, label: `set icon ${key} (${set.setName} chest)` })
      else warnings.push(`set icon ${dest} is missing and set ${set.prefix} has no chest piece to download it from`)
    }
  }
  files.push({ path: 'data/armor-monsters.json', data: armorMonsters })

  const changedIds = new Set(changed.map(c => c.id))
  const summary = [
    `${official.length} official pieces in ${sets.size} sets (current ${currentTotal}): ${added.length} added, ${changedIds.size} changed (${changed.length} field changes), ${keptMissingUpstream.length} kept (missing upstream)`,
  ]
  if (iconAdded.length) summary.push(`armor-monsters.json: ${iconAdded.length} new set icon entries (${iconAdded.join(', ')})`)
  if (images.length) summary.push(`${images.length} images to download`)
  log(`armor: ${summary.join('; ')}`)

  return {
    name: 'armor',
    files,
    images,
    officialSkills: zh.skills,
    counts: { official: official.length, current: currentTotal },
    report: { summary, added, changed, keptMissingUpstream, newIds, overridesApplied, warnings },
  }
}

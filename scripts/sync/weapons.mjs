/**
 * Weapons sync: /zh/weapons + /en/weapons island "SortableWeaponList" plus every
 * zh detail page /zh/weapons/<id> -> data/weapons/<type>.json (14 files).
 *
 * The island carries every number (all grades and levels, skills, SP kind and
 * level, type specs) and the zh/en names; zh and en differ only in
 * guideTranslations. Detail pages are fetched for the zh strings the island does
 * not translate (SP skill names, recoil/reload labels, phial/shelling/melody
 * descriptions, charge-blade element phial names, bow coatings, kinsect names)
 * and to cross-check the island numbers against the page's "10 Lv 5" row.
 *
 * Detail text fallback: every detail-only string labels an official enum value
 * (SP kind, RECOIL_*, PHIAL_*, MELODY_*, kinsectType, ...) and was identical on
 * every page showing that value (all 721 pages, 2026-10: 0 conflicts). When a
 * weapon's page cannot be fetched or lacks a section, each string is taken from
 *   1. the same enum value on another weapon's page in this run, else
 *   2. the weapon's current record, if it exists and still matches the island
 *      (same SP level, same ammo / melody names ...), else
 *   3. the run fails (no partial data).
 * Each fallback is a report warning, and more than 2% of weapons (min 5) needing
 * one fails the run too: that means a markup change or an outage, not a glitch.
 * So a new weapon whose page fails still syncs when every string it needs is shown
 * on another page; only its <h1> name cross-check (a warning anyway) is lost.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { applyOverrides } from './lib/diff.mjs'
import { mergeWithManual } from './lib/extra-gear.mjs'
import { extractIsland, htmlToText, stripGradeSuffix, translator } from './lib/html.mjs'
import { ROOT, WEAPON_TYPES, jsonEqual } from './lib/io.mjs'

const ISLAND = 'SortableWeaponList'
const SHRINK_RATIO = 0.9
const MAX_LISTED_WARNINGS = 60
// Google CDN base URL + this suffix returns the 128x128 lossless WebP that the
// existing public/images files were saved from (byte-identical).
const IMAGE_SUFFIX = '=s128-rw'
const WEAPON_ID = /^[a-z0-9]+(_[a-z0-9]+)*$/

/** Official category -> data/weapons/<slug>.json */
const CATEGORY_TO_SLUG = {
  GREAT_SWORD: 'great-sword',
  LONG_SWORD: 'long-sword',
  SWORD_SHIELD: 'sword-and-shield',
  DUAL_BLADES: 'dual-blades',
  HAMMER: 'hammer',
  HUNTING_HORN: 'hunting-horn',
  LANCE: 'lance',
  GUNLANCE: 'gunlance',
  SWITCH_AXE: 'switch-axe',
  CHARGE_BLADE: 'charge-blade',
  INSECT_GLAIVE: 'insect-glaive',
  LIGHT_BOWGUN: 'light-bowgun',
  HEAVY_BOWGUN: 'heavy-bowgun',
  BOW: 'bow',
}
/** Island spec object each category must carry (its type-specific fields come from it). */
const CATEGORY_SPEC = {
  HUNTING_HORN: 'huntingHornSpec',
  GUNLANCE: 'gunlanceSpec',
  SWITCH_AXE: 'switchAxeSpec',
  CHARGE_BLADE: 'chargeBladeSpec',
  INSECT_GLAIVE: 'insectGlaiveSpec',
  LIGHT_BOWGUN: 'bowgunSpec',
  HEAVY_BOWGUN: 'bowgunSpec',
  BOW: 'bowSpec',
}
/** Lowercased island element enum; NO_ELEMENT -> null. Mirrors the app's elementNames. */
const ELEMENTS = new Set(['fire', 'water', 'thunder', 'ice', 'dragon', 'poison', 'paralysis', 'sleep', 'blast'])

{
  const slugs = Object.values(CATEGORY_TO_SLUG)
  if (slugs.length !== WEAPON_TYPES.length || slugs.some(s => !WEAPON_TYPES.includes(s))) {
    throw new Error('weapons: CATEGORY_TO_SLUG and io.mjs WEAPON_TYPES are out of sync')
  }
}

// ---- detail page parsing (ported from the verified prototype) ----------------

const tagText = (html, tag) => {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? htmlToText(m[1]) : null
}

/** Body rows of a table as arrays of raw cell HTML. */
function tableRows(tableHtml) {
  const tbody = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbody) return []
  return [...tbody[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(r => [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => c[1]))
}

/** The page's <article> split into top-level sections: [{ id, heading, html }]. */
function articleSections(html) {
  const a = html.indexOf('<article')
  const b = html.indexOf('</article>')
  const article = a >= 0 && b > a ? html.slice(a, b) : html
  return [...article.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)].map(m => ({
    id: (m[1].match(/\bid="([^"]*)"/) || [])[1] || '',
    heading: tagText(m[2], 'h3') ?? '',
    html: m[2],
  }))
}

/**
 * Parse a zh weapon detail page. Every field is optional: a missing one means
 * the page did not show it, and the caller decides whether that matters.
 */
export function parseDetail(html) {
  const sections = articleSections(html)
  const d = {}

  // section#overview <h1> is the base (grade-1) name
  const overview = sections.find(s => s.id === 'overview')
  d.name = (overview && tagText(overview.html, 'h1')) || null

  // Desktop stats table = the section#stats that contains a <table>
  const stats = sections.find(s => s.id === 'stats' && /<table/i.test(s.html))
  if (stats) {
    const sp = [...stats.html.matchAll(/<p[^>]*>\s*(【SP】[^<]+?)\s*<\/p>/g)].map(m => htmlToText(m[1]))
    d.spSkill = sp.at(-1) ?? null // one per grade; the last is grade 10
    const last = tableRows(stats.html).at(-1) ?? []
    if (last.length && /^\d+\s*Lv\s*\d+$/.test(htmlToText(last[0]))) {
      d.maxLabel = htmlToText(last[0])
      d.maxAttack = parseInt(htmlToText(last[1] ?? ''), 10)
      const elementCell = last.slice(2).find(c => /element_[a-z]+\.png/.test(c))
      d.maxElement = elementCell
        ? { type: elementCell.match(/element_([a-z]+)\.png/)[1], value: parseInt(htmlToText(elementCell), 10) }
        : null
    }
    // affinity cells: <td rowspan=N><p>X%</p></td> (0% is <p class="_fadeText_...">)
    const affinities = [...stats.html.matchAll(/<td[^>]*>\s*<p[^>]*>\s*(-?\d+)%\s*<\/p>\s*<\/td>/g)].map(m => parseInt(m[1], 10))
    d.maxAffinity = affinities.at(-1) ?? null
    d.skillSlugs = [...new Set([...stats.html.matchAll(/href="\/zh\/skills\/([a-z0-9_]+)"/g)].map(m => m[1]))]
  }

  for (const s of sections) {
    const h = s.heading
    const table = s.html.match(/<table[\s\S]*?<\/table>/i)
    const rows = table ? tableRows(table[0]) : []
    if (h === '彈藥種類') {
      d.ammo = rows.map(c => ({
        name: tagText(c[0], 'h3') ?? '',
        capacity: parseInt(htmlToText(c[1] ?? ''), 10),
        recoil: htmlToText(c[2] ?? ''),
        reload: htmlToText(c[3] ?? ''),
      }))
    } else if (h === '蓄力射擊') {
      d.chargingShots = rows.map(c => tagText(c[0], 'h3') ?? htmlToText(c[0]))
    } else if (h === '瓶類型' || h === '砲擊類型') {
      // a table (name cell = icon + text, description), or just <p>無</p> on bows
      let value
      if (rows.length) value = { name: htmlToText(rows[0][0]), description: htmlToText(rows[0][1] ?? '') }
      else {
        const p = s.html.match(/<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/i)
        value = p ? { name: htmlToText(p[1]), description: '' } : null
      }
      if (h === '砲擊類型') d.shellingType = value
      else d.phial = value
    } else if (h === '旋律效果') {
      d.melodies = rows.map(c => ({ name: htmlToText(c[1] ?? ''), description: htmlToText(c[2] ?? '') }))
    } else if (h.startsWith('獵蟲')) {
      const h4 = label => {
        const m = s.html.match(new RegExp(`<h4[^>]*>(?:(?!<\\/h4>)[\\s\\S])*?${label}[：:]\\s*([^<]+?)\\s*<\\/h4>`))
        return m ? htmlToText(m[1]) : ''
      }
      d.kinsect = {
        name: h.replace(/^獵蟲[：:]\s*/, '').trim(),
        type: h4('獵蟲類型'),
        performanceType: h4('性能類型'),
        attackSystem: h4('攻擊系統'),
        bonus: h4('獵蟲加成'),
      }
    }
  }
  return d
}

// ---- helpers ----------------------------------------------------------------

/** Warnings grouped by check, listed up to a cap with per-check counts. */
function createWarnings() {
  const list = []
  const byCheck = new Map()
  return {
    add(check, message) {
      list.push(message)
      byCheck.set(check, (byCheck.get(check) ?? 0) + 1)
    },
    count: check => (check ? byCheck.get(check) ?? 0 : list.length),
    lines() {
      if (list.length <= MAX_LISTED_WARNINGS) return [...list]
      const counts = [...byCheck].map(([c, n]) => `${c} ${n}`).join(', ')
      return [...list.slice(0, MAX_LISTED_WARNINGS), `… ${list.length - MAX_LISTED_WARNINGS} more warnings not listed (by check: ${counts})`]
    },
  }
}

/** A detail-only string no source could provide; collected so the markup guard can report first. */
class MissingTextError extends Error {}

const bySortOrder = (a, b) => (a.sortOrder < b.sortOrder ? -1 : a.sortOrder > b.sortOrder ? 1 : a.id < b.id ? -1 : 1)

/**
 * The detail-only strings one page provides, keyed by the official enum value
 * they label, plus cross-check warnings against the island.
 */
function detailLabels(w, d, zh, warn) {
  const id = w.id.toLowerCase()
  const labels = new Map()
  if (!d) return labels
  const tr = key => zh.guideTranslations[key] // cross-check only: never required
  const set = (key, value) => {
    const prev = labels.get(key)
    if (prev !== undefined && !jsonEqual(prev, value)) warn('label-conflict', `${id}: page shows two texts for ${key}: ${JSON.stringify(prev)} / ${JSON.stringify(value)}`)
    else labels.set(key, value)
  }

  const sp = w.grades.at(-1).specialSkill
  const spMatch = d.spSkill?.match(/^(【SP】.+?)\s*Lv\s*(\d+)$/)
  if (spMatch) {
    set(`sp:${sp.kind}`, spMatch[1])
    if (Number(spMatch[2]) !== sp.level) warn('sp-level', `${id}: detail SP "${d.spSkill}" but island ${sp.kind} Lv${sp.level} (island level used)`)
  }

  if (w.bowgunSpec && d.ammo) {
    const ammo = w.bowgunSpec.ammo
    if (d.ammo.length !== ammo.length) {
      warn('ammo', `${id}: detail lists ${d.ammo.length} ammo types, island ${ammo.length} (detail ammo ignored)`)
    } else {
      ammo.forEach((a, i) => {
        const row = d.ammo[i]
        const name = tr(`AMMO_NAME_${a.type.id}`)
        if (name && row.name !== name) warn('ammo', `${id}: ammo[${i}] name detail "${row.name}" island "${name}"`)
        if (row.capacity !== Number(a.capacity)) warn('ammo', `${id}: ammo[${i}] capacity detail ${row.capacity} island ${a.capacity}`)
        if (row.name) set(`ammo:${a.type.id}`, row.name)
        if (row.recoil) set(`recoil:${a.recoil}`, row.recoil)
        if (row.reload) set(`reload:${a.reload}`, row.reload)
      })
    }
  }

  if (w.bowSpec && d.phial?.name) set(`bottle:${w.element}`, d.phial.name)

  const phialSpec = w.switchAxeSpec ?? w.chargeBladeSpec
  if (phialSpec && d.phial?.name) {
    set(`phial:${w.category}:${phialSpec.phialType}`, d.phial)
    const name = tr(phialSpec.phialType)
    if (name && d.phial.name !== name) warn('phial', `${id}: phial detail "${d.phial.name}" island "${name}"`)
  }

  if (w.gunlanceSpec && d.shellingType?.name) {
    set(`shelling:${w.gunlanceSpec.shellingType}`, d.shellingType)
    const name = tr(w.gunlanceSpec.shellingType)
    if (name && d.shellingType.name !== name) warn('shelling', `${id}: shelling detail "${d.shellingType.name}" island "${name}"`)
  }

  if (w.huntingHornSpec && d.melodies) {
    const keys = w.huntingHornSpec.melody
    if (d.melodies.length !== keys.length) {
      warn('melody', `${id}: detail lists ${d.melodies.length} melodies, island ${keys.length} (detail melodies ignored)`)
    } else {
      keys.forEach((key, i) => {
        const m = d.melodies[i]
        if (!m.name) return
        set(`melody:${key}`, m)
        if (tr(key) && m.name !== tr(key)) warn('melody', `${id}: melody[${i}] detail "${m.name}" island "${tr(key)}"`)
      })
    }
  }

  if (w.insectGlaiveSpec && d.kinsect?.name) set(`kinsect:${w.insectGlaiveSpec.kinsectType}`, d.kinsect.name)
  return labels
}

// ---- sync -------------------------------------------------------------------

export async function syncWeapons(ctx) {
  const { http, current, skillIds, overrides = {}, extraGear = { weapons: [] }, log = () => {}, options = {} } = ctx
  const warnings = createWarnings()
  const warn = warnings.add

  log('weapons: fetching /zh/weapons and /en/weapons')
  const [zhHtml, enHtml] = await http.map(['/zh/weapons', '/en/weapons'], path => http.getText(path))
  const zh = extractIsland(zhHtml, ISLAND)
  const en = extractIsland(enHtml, ISLAND)
  for (const [label, props] of [['zh', zh], ['en', en]]) {
    if (!props.weapons || typeof props.weapons !== 'object') throw new Error(`weapons: ${label} island has no "weapons" object`)
    if (!props.skills || typeof props.skills !== 'object') throw new Error(`weapons: ${label} island has no "skills" object`)
  }

  const onlyZh = Object.keys(zh.weapons).filter(k => !(k in en.weapons))
  const onlyEn = Object.keys(en.weapons).filter(k => !(k in zh.weapons))
  if (onlyZh.length || onlyEn.length) {
    throw new Error(`weapons: zh/en weapon id sets differ (zh only: ${onlyZh.join(', ') || '-'}; en only: ${onlyEn.join(', ') || '-'})`)
  }
  if (!jsonEqual(zh.weapons, en.weapons)) warn('zh-en', 'zh and en weapon data differ beyond translations (site deployed between requests?); zh values were used')

  const categories = zh.weaponCategories
  if (!Array.isArray(categories) || categories.length !== 14) {
    throw new Error(`weapons: expected 14 weaponCategories, got ${JSON.stringify(categories)}`)
  }
  const unknownCategory = categories.find(c => !CATEGORY_TO_SLUG[c])
  if (unknownCategory) throw new Error(`weapons: unknown weapon category "${unknownCategory}" — add it to CATEGORY_TO_SLUG and the app's weapon types`)

  const zhT = translator(zh, 'zh/weapons')
  const enT = translator(en, 'en/weapons')

  // ---- validate the island and order it (official sortOrder) ----
  const all = Object.values(zh.weapons)
  const weapons = all.filter(w => w.enabled !== false).sort(bySortOrder)
  const disabled = all.length - weapons.length
  const seen = new Set()
  for (const w of weapons) {
    const id = String(w.id).toLowerCase()
    if (!WEAPON_ID.test(id)) throw new Error(`weapons: official id "${w.id}" does not lowercase to a snake_case id`)
    if (seen.has(id)) throw new Error(`weapons: duplicate id ${id}`)
    seen.add(id)
    if (!CATEGORY_TO_SLUG[w.category]) throw new Error(`weapons: ${w.id} has unknown category "${w.category}"`)
    const spec = CATEGORY_SPEC[w.category]
    if (spec && !w[spec]) throw new Error(`weapons: ${w.id} (${w.category}) has no ${spec}`)
    if (w.element !== 'NO_ELEMENT' && !ELEMENTS.has(String(w.element).toLowerCase())) {
      throw new Error(`weapons: ${w.id} has unknown element "${w.element}"`)
    }
    if (!Array.isArray(w.grades) || !w.grades.length) throw new Error(`weapons: ${w.id} has no grades`)
    w.grades = [...w.grades].sort((a, b) => a.grade - b.grade) // zh island is ours to normalise
    const last = w.grades.at(-1)
    const lv = last.levels?.at(-1)
    if (last.grade !== 10 || lv?.level !== 5) throw new Error(`weapons: ${w.id} tops out at G${last.grade} Lv${lv?.level}, expected G10 Lv5`)
    if (!last.specialSkill?.kind || !Number.isInteger(last.specialSkill.level)) throw new Error(`weapons: ${w.id} has no grade-10 specialSkill`)
    if (typeof w.grades[0].imageUrl !== 'string' || !/^https:\/\/[^\s"]+$/.test(w.grades[0].imageUrl)) {
      throw new Error(`weapons: ${w.id} has no usable grade-1 imageUrl (${JSON.stringify(w.grades[0].imageUrl)})`)
    }
  }

  const currentById = new Map()
  for (const type of WEAPON_TYPES) for (const r of current.weapons[type]) currentById.set(r.id, { record: r, type })
  const currentTotal = currentById.size
  if (weapons.length < currentTotal * SHRINK_RATIO && !options.allowShrink) {
    throw new Error(`weapons: official site lists ${weapons.length} weapons but data/weapons has ${currentTotal} (< ${SHRINK_RATIO * 100}%); re-run with --allow-shrink if this is expected`)
  }
  for (const w of weapons) {
    const id = w.id.toLowerCase()
    const cur = currentById.get(id)
    if (cur && cur.type !== CATEGORY_TO_SLUG[w.category]) {
      throw new Error(`weapons: ${id} moved from ${cur.type} to ${CATEGORY_TO_SLUG[w.category]}; weapon ids must stay in their type file`)
    }
  }

  // ---- detail pages (parsed immediately: ~420 KB of HTML each) ----
  log(`weapons: fetching ${weapons.length} detail pages`)
  let done = 0
  const details = await http.map(weapons, async w => {
    let result
    try {
      result = { detail: parseDetail(await http.getText(`/zh/weapons/${w.id.toLowerCase()}`)) }
    } catch (err) {
      result = { error: err.message }
    }
    if (++done % 100 === 0 || done === weapons.length) log(`weapons: detail pages ${done}/${weapons.length}`)
    return result
  })

  // Enum label table learned from every page of this run (fallback source 1).
  const pageLabels = weapons.map((w, i) => detailLabels(w, details[i].detail, zh, warn))
  const labelTable = new Map() // key -> { value, from }
  pageLabels.forEach((labels, i) => {
    for (const [key, value] of labels) {
      const known = labelTable.get(key)
      if (!known) labelTable.set(key, { value, from: weapons[i].id.toLowerCase() })
      else if (!jsonEqual(known.value, value)) {
        warn('label-conflict', `${key}: ${weapons[i].id.toLowerCase()} shows ${JSON.stringify(value)}, ${known.from} shows ${JSON.stringify(known.value)}`)
      }
    }
  })
  const spKindByName = new Map([...labelTable].filter(([k]) => k.startsWith('sp:')).map(([k, v]) => [v.value, k.slice(3)]))

  // ---- build official records ----
  const incomplete = new Map() // weapon id -> fallback notes
  const buildRecord = (w, i) => {
    const id = w.id.toLowerCase()
    const type = CATEGORY_TO_SLUG[w.category]
    const { detail: d, error } = details[i]
    const own = pageLabels[i]
    const cur = currentById.get(id)?.record
    const first = w.grades[0]
    const last = w.grades.at(-1)
    const lv = last.levels.at(-1)
    const note = msg => {
      if (!incomplete.has(id)) incomplete.set(id, [])
      incomplete.get(id).push(msg)
    }
    if (error) note(`detail page failed (${error})`)

    /** Detail-only string for an enum value: this page, else another page this run. */
    const label = (key, what) => {
      if (own.has(key)) return own.get(key)
      const known = labelTable.get(key)
      if (known) {
        note(`${what} taken from ${known.from}`)
        return structuredClone(known.value)
      }
      return undefined
    }
    /** Fallback source 2: the current record, if it still matches the island. */
    const fromCurrent = (what, matches) => {
      if (cur && matches(cur)) {
        note(`${what} kept from current data`)
        return
      }
      note(`no ${what}`)
      throw new MissingTextError(`weapons: ${id}: no ${what} — its detail page ${error ? 'failed' : 'does not show it'}, no other page shows the same value, and ${cur ? 'the current record no longer matches the island' : 'it is a new weapon'}`)
    }

    // name: detail <h1> guards against a base name that itself ends in a digit
    const islandName = stripGradeSuffix(zhT(first.name))
    if (d && !d.name) note('no <h1> name on the detail page')
    if (d?.name && d.name !== islandName) warn('name', `${id}: detail name "${d.name}" vs island "${islandName}" (detail used)`)
    const name = d?.name || islandName
    if (!name) throw new Error(`weapons: ${id} has an empty zh name`)
    const nameEn = stripGradeSuffix(enT(first.name))
    if (!nameEn) warn('name', `${id}: empty English name`)

    if (!Number.isInteger(lv.attack) || lv.attack <= 0) throw new Error(`weapons: ${id} has invalid G10 Lv5 attack ${lv.attack}`)
    if (!Number.isInteger(lv.critical)) throw new Error(`weapons: ${id} has invalid G10 Lv5 critical ${lv.critical}`)
    const elementType = w.element === 'NO_ELEMENT' ? null : w.element.toLowerCase()
    if (elementType && !(Number.isInteger(lv.elementAttack) && lv.elementAttack > 0)) {
      throw new Error(`weapons: ${id} is ${w.element} but its G10 Lv5 elementAttack is ${lv.elementAttack}`)
    }
    const element = elementType ? { type: elementType, value: lv.elementAttack } : null

    const sp = last.specialSkill
    let spSkill
    const spName = label(`sp:${sp.kind}`, 'SP skill name')
    if (spName) spSkill = `${spName} Lv${sp.level}`
    else {
      fromCurrent('SP skill', c => {
        const m = typeof c.spSkill === 'string' && c.spSkill.match(/^(【SP】.+?) Lv(\d+)$/)
        const otherKind = m && spKindByName.get(m[1])
        return m && Number(m[2]) === sp.level && (!otherKind || otherKind === sp.kind)
      })
      spSkill = cur.spSkill
    }

    const skillKinds = new Set()
    const skills = last.skills.map(s => {
      if (!Number.isInteger(s.level) || s.level < 1) throw new Error(`weapons: ${id} skill ${s.kind} has invalid level ${s.level}`)
      if (skillKinds.has(s.kind)) warn('skills', `${id}: lists skill ${s.kind} twice`)
      skillKinds.add(s.kind)
      const skill = { skillId: skillIds.resolve(s.kind, `weapon ${w.id}`), level: s.level }
      if (s.requiredCustomEnhancementLevel) skill.requiredCustomEnhancementLevel = s.requiredCustomEnhancementLevel
      return skill
    })

    const record = {
      id,
      name,
      nameEn,
      type,
      attack: lv.attack,
      element,
      affinity: lv.critical,
      spSkill,
      skills,
      image: `/images/weapons/${id}.webp`,
    }

    // cross-check the island numbers against the page's last stats row
    if (d) {
      if (d.maxLabel === undefined) warn('detail-stats', `${id}: detail stats table has no final grade row`)
      else {
        if (d.maxLabel.replace(/\s+/g, '') !== '10Lv5') warn('detail-stats', `${id}: last detail stats row is "${d.maxLabel}", expected "10 Lv 5"`)
        if (d.maxAttack !== record.attack) warn('detail-stats', `${id}: attack detail ${d.maxAttack} island ${record.attack}`)
        if (!jsonEqual(d.maxElement, element)) warn('detail-stats', `${id}: element detail ${JSON.stringify(d.maxElement)} island ${JSON.stringify(element)}`)
      }
      if (d.maxAffinity !== undefined && d.maxAffinity !== null && d.maxAffinity !== record.affinity) {
        warn('detail-stats', `${id}: affinity detail ${d.maxAffinity} island ${record.affinity}`)
      }
      for (const s of last.skills) {
        if (d.skillSlugs && !d.skillSlugs.includes(s.kind.toLowerCase())) warn('detail-skills', `${id}: skill ${s.kind} is not linked on the detail page`)
      }
    }

    // ---- type-specific fields, same keys and order as the current files ----
    if (w.huntingHornSpec) {
      record.melodies = w.huntingHornSpec.melody.map((key, j) => {
        let m = label(`melody:${key}`, `melody ${key}`)
        if (!m) {
          fromCurrent(`melody ${key}`, c => c.melodies?.[j]?.name === zhT(key))
          m = cur.melodies[j]
        }
        return { name: m.name, description: m.description }
      })
    }
    if (w.gunlanceSpec) {
      const kind = w.gunlanceSpec.shellingType
      let shelling = label(`shelling:${kind}`, 'shelling type')
      if (!shelling) {
        fromCurrent('shelling type', c => c.shellingType?.name === zhT(kind))
        shelling = cur.shellingType
      }
      record.shellingType = { name: shelling.name, description: shelling.description }
    }
    const phialSpec = w.switchAxeSpec ?? w.chargeBladeSpec
    if (phialSpec) {
      const kind = phialSpec.phialType
      let phial = label(`phial:${w.category}:${kind}`, 'phial')
      if (!phial) {
        // charge-blade PHIAL_ELEMENT_* has no island translation to compare with
        const islandName = zh.guideTranslations[kind]
        fromCurrent('phial', c => Boolean(c.phial?.name) && (!islandName || c.phial.name === islandName))
        phial = cur.phial
      }
      record.phial = { name: phial.name, description: phial.description }
    }
    if (w.insectGlaiveSpec) {
      const s = w.insectGlaiveSpec
      let kinsectName = label(`kinsect:${s.kinsectType}`, 'kinsect name')
      if (!kinsectName) {
        fromCurrent('kinsect name', c => typeof c.kinsect?.name === 'string' && c.kinsect.name !== '')
        kinsectName = cur.kinsect.name
      }
      const kinsect = { name: kinsectName }
      const islandKeys = {
        type: `ATTACK_TYPE_${s.attackType}`,
        performanceType: s.parameterType,
        attackSystem: s.attackAttribute,
        bonus: `BONUS_${s.bonusKind}`,
      }
      for (const [field, key] of Object.entries(islandKeys)) {
        const fromPage = d?.kinsect?.[field] || null
        if (fromPage && zh.guideTranslations[key] && fromPage !== zh.guideTranslations[key]) {
          warn('kinsect', `${id}: kinsect.${field} detail "${fromPage}" island "${zh.guideTranslations[key]}"`)
        }
        kinsect[field] = fromPage ?? zhT(key)
      }
      record.kinsect = kinsect
    }
    if (w.bowgunSpec) {
      record.ammo = w.bowgunSpec.ammo.map((a, j) => {
        const capacity = Number(a.capacity)
        if (!Number.isInteger(capacity) || capacity < 0) throw new Error(`weapons: ${id} ammo[${j}] has invalid capacity ${a.capacity}`)
        const ammoName = own.get(`ammo:${a.type.id}`) ?? zhT(`AMMO_NAME_${a.type.id}`)
        let recoil = label(`recoil:${a.recoil}`, `recoil ${a.recoil}`)
        let reload = label(`reload:${a.reload}`, `reload ${a.reload}`)
        if (recoil === undefined || reload === undefined) {
          const c = cur?.ammo?.[j]
          fromCurrent(`ammo[${j}] recoil/reload`, () => c?.name === ammoName && c.capacity === capacity)
          recoil ??= c.recoil
          reload ??= c.reload
        }
        return { name: ammoName, capacity, recoil, reload }
      })
    }
    if (w.bowSpec) {
      const arrows = w.bowSpec.arrows.map(k => zhT(k))
      const fromPage = d?.chargingShots
      if (fromPage && !jsonEqual(fromPage, arrows)) warn('charging-shots', `${id}: charging shots detail ${JSON.stringify(fromPage)} island ${JSON.stringify(arrows)}`)
      record.chargingShots = fromPage?.length === arrows.length ? fromPage : arrows
      let bottle = label(`bottle:${w.element}`, 'bow coating')
      if (bottle === undefined) {
        fromCurrent('bow coating', c => typeof c.bottleType === 'string')
        bottle = cur.bottleType
      }
      record.bottleType = bottle
    }
    return { record, w }
  }
  const records = []
  const missingText = []
  weapons.forEach((w, i) => {
    try {
      records.push(buildRecord(w, i))
    } catch (err) {
      if (!(err instanceof MissingTextError)) throw err
      missingText.push(err.message)
    }
  })

  // ---- fallback guard: many incomplete pages = markup change or outage ----
  const maxIncomplete = Math.max(5, Math.ceil(weapons.length * 0.02))
  if (incomplete.size > maxIncomplete) {
    const sample = [...incomplete].slice(0, 5).map(([id, notes]) => `${id}: ${notes.join('; ')}`).join(' | ')
    throw new Error(`weapons: ${incomplete.size} weapons lack detail-page text (limit ${maxIncomplete}); the detail page markup may have changed. e.g. ${sample}`)
  }
  if (missingText.length) {
    const more = missingText.length > 5 ? ` (+${missingText.length - 5} more)` : ''
    throw new Error(missingText.slice(0, 5).join('\n') + more)
  }
  for (const [id, notes] of incomplete) warn('fallback', `${id}: ${notes.join('; ')}`)

  // ---- merge per type file ----
  const officialRecords = records.map(r => r.record)
  const overridesApplied = applyOverrides(officialRecords, overrides.weapons)
  const files = []
  const added = []
  const changed = []
  const keptMissingUpstream = []
  const manual = []
  const removedManual = []
  for (const type of WEAPON_TYPES) {
    const merged = mergeWithManual(
      current.weapons[type],
      officialRecords.filter(r => r.type === type),
      extraGear.weapons.filter(r => r.type === type),
      'weapon',
    )
    files.push({ path: `data/weapons/${type}.json`, data: merged.list })
    added.push(...merged.added.map(r => `${r.id} ${r.name}`))
    changed.push(...merged.changed)
    keptMissingUpstream.push(...merged.keptMissingUpstream.map(r => `${r.id} ${r.name}`))
    manual.push(...merged.manual)
    removedManual.push(...merged.removedManual)
    for (const w of merged.warnings) warnings.add('manual', w)
  }
  const strayManual = extraGear.weapons.filter(r => !WEAPON_TYPES.includes(r.type))
  if (strayManual.length) throw new Error(`extra-gear.json: weapon ${strayManual.map(r => r.id).join(', ')} has no valid "type"`)

  // ---- grade-1 images for weapons that have no file yet ----
  const images = []
  for (const { record, w } of records) {
    const dest = `public/images/weapons/${record.id}.webp`
    if (!existsSync(join(ROOT, dest))) {
      images.push({ url: w.grades[0].imageUrl + IMAGE_SUFFIX, dest, label: `weapon ${record.id} ${record.name}` })
    }
  }

  const changedIds = new Set(changed.map(c => c.id))
  const fieldCounts = new Map()
  for (const c of changed) fieldCounts.set(c.field, (fieldCounts.get(c.field) ?? 0) + 1)
  const parsed = details.filter(x => x.detail).length
  const summary = [
    `${officialRecords.length} official weapons in ${categories.length} types${disabled ? ` (${disabled} disabled skipped)` : ''} (current ${currentTotal}): ${added.length} added, ${changedIds.size} changed (${changed.length} field changes), ${keptMissingUpstream.length} kept (missing upstream)`,
    `detail pages: ${parsed}/${weapons.length} parsed, ${incomplete.size} weapons used fallback text, ${warnings.count() - warnings.count('fallback')} cross-check warnings`,
  ]
  if (manual.length || removedManual.length) {
    summary.push(`manual (extra-gear.json): ${manual.length} weapons${removedManual.length ? `, removed ${removedManual.join(', ')}` : ''}`)
  }
  if (fieldCounts.size) summary.push(`changed fields: ${[...fieldCounts].sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} ${n}`).join(', ')}`)
  if (images.length) summary.push(`${images.length} images to download`)
  log(`weapons: ${summary.join('; ')}`)

  return {
    name: 'weapons',
    files,
    images,
    officialSkills: zh.skills,
    monsterInput: { weaponSeries: weapons.map(w => [w.id.toLowerCase(), w.series]) },
    counts: { official: officialRecords.length, current: currentTotal },
    report: { summary, added, changed, keptMissingUpstream, newIds: [], overridesApplied, warnings: warnings.lines() },
  }
}

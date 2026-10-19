/**
 * Skills + driftstones sync.
 *
 * /zh/skills and /en/skills embed every skill and driftstone as JSON in
 * <root-island component="SortableSkillList">; props:
 *   skills[KIND] = { kind, skillId, category, maxLevel, sortOrder, name: 'SKILL_NAME_<n>',
 *                    levels: [{ level, description: '<TEMPLATE_KEY>', effectAmount: [], conditionAmount: [] }] }
 *   driftstones[NAME] = { id, name: 'RED_FEYSTONE_1', enabled, skills: [{ skillKind, skillLevel, sortId, weight }] }
 *   guideTranslations, skillCategories, driftstoneOrder, locale
 * Produces data/skills.json and data/driftstone-skills.json.
 */
import { applyOverrides, mergeRecords } from './lib/diff.mjs'
import { extractIsland, translator } from './lib/html.mjs'
import { jsonEqual } from './lib/io.mjs'

const ISLAND = 'SortableSkillList'
const MIN_SKILLS = 100
const SHRINK_RATIO = 0.9

/** Official category -> skills.json category (DEFENCE_BOOST is split below). */
const CATEGORY = {
  ATTACK_BOOST: 'attack',
  ELEMENT_BOOST: 'element',
  BATTLE_ACTION: 'utility',
  DEFENCE_BOOST: 'defense',
  OTHERS: 'other',
}
const RESISTANCE_NAME = /(耐性|^耳塞$|^耐震$)/

/** Colour stone name prefix -> stone id (must exist in the app's StoneSwatch colours). */
const COLOUR_STONES = { RED: 'red', BLUE: 'blue', YELLOW: 'yellow', SKY: 'sky', WHITE: 'white', BLACK: 'black' }
const STONE_NAME = /^([A-Z0-9_]+)_FEYSTONE_\d+$/
const COLOUR_LABEL = /^漂流石【.+】$/
const PRIME_LABEL = /^漂流純石【(.+)】$/

/** Unity rich-text tags used in templates (e.g. <color=#FF0000>…</color>). */
const RICH_TEXT_TAG = /<\/?(?:color|b|i|size|material)(?:=[^>]*)?>/gi

function mapCategory(official, zhName, kind) {
  const category = CATEGORY[official]
  if (!category) throw new Error(`skills: ${kind} has unknown official category "${official}"`)
  return category === 'defense' && RESISTANCE_NAME.test(zhName) ? 'resistance' : category
}

/** Fill a level template; throws on any placeholder it cannot resolve. */
function renderEffect(template, lv, label) {
  const text = template
    .replace(/\{(effect|condition)_amount_(\d+)\}/g, (all, kind, n) => {
      const value = (kind === 'effect' ? lv.effectAmount : lv.conditionAmount)?.[Number(n) - 1]
      if (value === undefined || value === null) throw new Error(`skills: ${label}: unresolved placeholder ${all} in "${template}"`)
      return String(value)
    })
    .replace(RICH_TEXT_TAG, '')
    .replace(/\s+/g, ' ')
    .trim()
  const leftover = text.match(/\{[^{}]*\}/)
  if (leftover) throw new Error(`skills: ${label}: unresolved placeholder ${leftover[0]} in "${template}"`)
  return text
}

function guardShrink(label, official, current, allowShrink) {
  if (!allowShrink && official < current * SHRINK_RATIO) {
    throw new Error(`${label}: official count ${official} is below ${SHRINK_RATIO * 100}% of the current ${current} — refusing to continue (re-run with --allow-shrink if this is expected)`)
  }
}

function sameKeys(a, b) {
  return jsonEqual(Object.keys(a).sort(), Object.keys(b).sort())
}

async function loadIslands(http) {
  const [zhHtml, enHtml] = await Promise.all([http.getText('/zh/skills'), http.getText('/en/skills')])
  const zh = extractIsland(zhHtml, ISLAND)
  const en = extractIsland(enHtml, ISLAND)
  if (zh.locale?.name !== 'zh') throw new Error(`/zh/skills: unexpected locale ${JSON.stringify(zh.locale)}`)
  if (en.locale?.name !== 'en') throw new Error(`/en/skills: unexpected locale ${JSON.stringify(en.locale)}`)
  for (const key of ['skills', 'driftstones']) {
    if (!zh[key] || typeof zh[key] !== 'object' || !en[key] || typeof en[key] !== 'object') {
      throw new Error(`skills: island ${ISLAND} has no "${key}" object`)
    }
    if (!sameKeys(zh[key], en[key])) throw new Error(`skills: zh/en ${key} id sets differ (deploy skew? re-run later)`)
  }
  return { zh, en }
}

/** Official skills -> skills.json records (official sortOrder), before overrides/merge. */
function buildSkills({ zh, en, current, skillIds, warnings }) {
  const zhT = translator(zh, '/zh/skills')
  const enT = translator(en, '/en/skills')
  const curById = new Map(current.skills.map(s => [s.id, s]))
  const curByName = new Map(current.skills.map(s => [s.name, s]))

  if (!jsonEqual(zh.skills, en.skills)) warnings.push('skills: zh and en skill data differ beyond translations (deploy skew?); numbers were taken from /zh/skills')

  const records = []
  const skipped = []
  const official = Object.entries(zh.skills)
    .map(([key, s]) => {
      if (s?.kind !== key) throw new Error(`skills: skills["${key}"] has kind ${JSON.stringify(s?.kind)}`)
      return s
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.kind.localeCompare(b.kind))

  for (const s of official) {
    const id = skillIds.assign(s.kind)
    if (id === null) {
      skipped.push(`${s.kind.toLowerCase()} (${zh.guideTranslations?.[s.name] ?? s.name})`)
      continue
    }
    const name = zhT(s.name)
    if (!Number.isInteger(s.maxLevel) || s.maxLevel < 1 || !Array.isArray(s.levels) || !s.levels.length) {
      throw new Error(`skills: ${s.kind} has an unexpected shape (maxLevel ${s.maxLevel}, ${s.levels?.length} levels)`)
    }
    if (s.levels.length !== s.maxLevel) warnings.push(`${id} ${name}: official lists ${s.levels.length} levels but maxLevel is ${s.maxLevel}`)

    const cur = curById.get(id)
    const holder = curByName.get(name)
    if (cur && cur.name !== name && holder && holder.id !== id) {
      throw new Error(`skills: id mapping drift — official ${s.kind} (-> ${id}, currently 「${cur.name}」) is now named 「${name}」, which is current skill ${holder.id}; fix skillIds in config/id-maps.json`)
    }
    if (!cur && holder) warnings.push(`${id} ${name}: new official skill shares its zh name with current skill ${holder.id} — check skillIds in config/id-maps.json`)

    records.push({
      id,
      name,
      nameEn: enT(en.skills[s.kind].name),
      description: cur?.description ?? '',
      maxLevel: s.maxLevel,
      category: mapCategory(s.category, name, s.kind),
      levels: s.levels.map(lv => {
        if (!Number.isInteger(lv.level)) throw new Error(`skills: ${s.kind} has a non-integer level ${JSON.stringify(lv.level)}`)
        return { level: lv.level, effect: renderEffect(zhT(lv.description), lv, `${s.kind} Lv${lv.level}`) }
      }),
    })
  }

  const seen = new Set()
  for (const r of records) {
    if (seen.has(r.id)) throw new Error(`skills: duplicate skills.json id "${r.id}" — two official kinds map to it in config/id-maps.json`)
    seen.add(r.id)
  }
  if (records.length < MIN_SKILLS) throw new Error(`skills: only ${records.length} official skills parsed (expected at least ${MIN_SKILLS})`)
  return { records, skipped }
}

/** Official enabled driftstones -> { id, name, prime, skillIds } in official order. */
function buildStones({ zh, skillIds, skillNames, warnings }) {
  const zhT = translator(zh, '/zh/skills')
  const order = new Map((zh.driftstoneOrder ?? []).map((id, i) => [String(id), i]))
  const rank = d => order.get(String(d.id)) ?? order.size + Number(d.id)
  const all = Object.values(zh.driftstones)
  const enabled = all.filter(d => d.enabled === true).sort((a, b) => rank(a) - rank(b))

  const stones = enabled.map(d => {
    const label = `Driftstone ${d.name}`
    const m = STONE_NAME.exec(d.name ?? '')
    if (!m || !Array.isArray(d.skills) || !d.skills.length) throw new Error(`skills: ${label} (id ${d.id}) has an unexpected name or no skills`)
    const base = m[1]
    let id
    let prime
    if (COLOUR_STONES[base]) {
      id = COLOUR_STONES[base]
      prime = false
    }
    else if (zh.skills[base] && d.skills.length === 1 && d.skills[0].skillKind === base) {
      id = base.toLowerCase().replace(/_/g, '-') + '-prime'
      prime = true
    }
    else {
      throw new Error(`skills: ${label} (id ${d.id}) is neither a known colour stone (${Object.keys(COLOUR_STONES).join('/')}) nor a single-skill prime stone — a new colour needs an entry in COLOUR_STONES and the app's StoneSwatch`)
    }

    const ids = d.skills
      .slice()
      .sort((a, b) => a.sortId - b.sortId)
      .map(x => {
        if (x.skillLevel !== 1) throw new Error(`skills: ${label} offers ${x.skillKind} at Lv${x.skillLevel}; the app assumes every driftstone skill is Lv1`)
        if (!zh.skills[x.skillKind]) throw new Error(`skills: ${label} references skill ${x.skillKind}, which is not in the official skill list`)
        return skillIds.resolve(x.skillKind, label)
      })
    if (new Set(ids).size !== ids.length) warnings.push(`driftstone ${id}: duplicate skills in its pool`)

    const name = zhT('DRIFTSTONE_NAME_' + d.name)
    if (prime) {
      const inner = PRIME_LABEL.exec(name)?.[1]
      if (inner !== skillNames.get(ids[0])) warnings.push(`driftstone ${id}: name 「${name}」 does not match its skill ${ids[0]} 「${skillNames.get(ids[0])}」`)
    }
    else if (!COLOUR_LABEL.test(name)) {
      warnings.push(`driftstone ${id}: name 「${name}」 does not match 漂流石【X】 (the picker's colour filter label relies on it)`)
    }
    return { id, name, prime, skillIds: ids }
  })

  const seen = new Set()
  for (const s of stones) {
    if (seen.has(s.id)) throw new Error(`skills: duplicate driftstone id "${s.id}"`)
    seen.add(s.id)
  }
  return { stones, disabled: all.length - enabled.length }
}

function countByField(changed) {
  const counts = {}
  for (const c of changed) counts[c.field] = (counts[c.field] ?? 0) + 1
  return Object.entries(counts).map(([f, n]) => `${f} ${n}`).join(', ') || 'none'
}

/**
 * Must run before armor/weapons: it assigns skills.json ids for new official kinds.
 * Writes nothing; returns both files for index.mjs to validate and write.
 */
export async function syncSkills(ctx) {
  const { http, current, skillIds, overrides, log, options = {} } = ctx
  const warnings = []
  const addedBefore = skillIds.added.length

  const { zh, en } = await loadIslands(http)
  log(`skills: ${Object.keys(zh.skills).length} official skills, ${Object.keys(zh.driftstones).length} driftstones`)

  // ---- skills.json ----------------------------------------------------------
  const { records, skipped } = buildSkills({ zh, en, current, skillIds, warnings })
  guardShrink('skills', records.length, current.skills.length, options.allowShrink)
  const overridesApplied = applyOverrides(records, overrides?.skills)
  const skills = mergeRecords(current.skills, records)
  for (const s of skills.list) {
    if (!s.description) warnings.push(`${s.id} ${s.name}: needs a hand-written description`)
  }

  // ---- driftstone-skills.json ----------------------------------------------
  const skillNames = new Map(skills.list.map(s => [s.id, s.name]))
  const { stones: officialStones, disabled } = buildStones({ zh, skillIds, skillNames, warnings })
  const curStones = current.driftstones.stones
  if (!officialStones.length) throw new Error('skills: no enabled driftstones found')
  guardShrink('driftstones', officialStones.length, curStones.length, options.allowShrink)
  const stones = mergeRecords(curStones, officialStones)
  const achievableSkillIds = [...new Set(stones.list.flatMap(s => s.skillIds))].sort()
  for (const id of achievableSkillIds) {
    if (!skillNames.has(id)) warnings.push(`driftstones: skill id "${id}" is not in skills.json`)
  }
  const curAchievable = new Set(current.driftstones.achievableSkillIds)
  const nextAchievable = new Set(achievableSkillIds)
  const achievableAdded = achievableSkillIds.filter(id => !curAchievable.has(id))
  const achievableRemoved = current.driftstones.achievableSkillIds.filter(id => !nextAchievable.has(id))

  // ---- report ---------------------------------------------------------------
  const stoneKey = id => `driftstone:${id}`
  const changed = [
    ...skills.changed,
    ...stones.changed.map(c => ({ ...c, id: stoneKey(c.id) })),
  ]
  // from/to of this entry list only the removed/added ids, not the full arrays
  if (achievableAdded.length || achievableRemoved.length) {
    changed.push({ id: 'driftstones', field: 'achievableSkillIds', from: achievableRemoved, to: achievableAdded })
  }

  const summary = [
    `skills: ${records.length} official (${records.length - skills.added.length} existing, ${skills.added.length} new`
    + `${skills.keptMissingUpstream.length ? `, ${skills.keptMissingUpstream.length} kept missing upstream` : ''})`
    + `${skipped.length ? `; skipped excluded kinds: ${skipped.join(', ')}` : ''}`,
    `skills: ${skills.changed.length} field changes (${countByField(skills.changed)})`,
    `driftstones: ${officialStones.length} official stones (${stones.added.length} new`
    + `${stones.keptMissingUpstream.length ? `, ${stones.keptMissingUpstream.length} kept missing upstream` : ''}`
    + `${disabled ? `, ${disabled} disabled skipped` : ''}), ${stones.changed.length} field changes; `
    + `achievable skills ${curAchievable.size} -> ${achievableSkillIds.length} (+${achievableAdded.length} / -${achievableRemoved.length})`,
  ]

  return {
    name: 'skills',
    files: [
      { path: 'data/skills.json', data: skills.list },
      { path: 'data/driftstone-skills.json', data: { stones: stones.list, achievableSkillIds } },
    ],
    images: [],
    officialSkills: zh.skills,
    counts: { official: records.length, current: current.skills.length },
    report: {
      summary,
      added: [
        ...skills.added.map(s => `${s.id} ${s.name}`),
        ...stones.added.map(s => `${stoneKey(s.id)} ${s.name}`),
      ],
      changed,
      keptMissingUpstream: [
        ...skills.keptMissingUpstream.map(s => `${s.id} ${s.name}`),
        ...stones.keptMissingUpstream.map(s => `${stoneKey(s.id)} ${s.name}`),
      ],
      newIds: skillIds.added.slice(addedBefore).map(a => `skill ${a.id} ${skillNames.get(a.id) ?? ''} (official ${a.slug}, default rule)`),
      overridesApplied,
      warnings,
    },
  }
}

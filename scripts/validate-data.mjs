#!/usr/bin/env node
/**
 * Zero-dependency validator for data/ and the images it references under public/.
 *
 *   node scripts/validate-data.mjs [--data-dir DIR] [--public-dir DIR] [--json] [--all]
 *
 * Errors are invariants the app relies on (exact skill ids, unique ids, existing WebP images, ...);
 * warnings deserve a human look but do not break the app. Exits 1 when there is at least one error.
 * The data sync calls validateData() on a temp copy of data/ before writing, so every path derives
 * from the dataDir/publicDir arguments.
 */
import { closeSync, fstatSync, openSync, readdirSync, readFileSync, readSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARMOR_PARTS, ROOT, WEAPON_TYPES, formatJson } from './sync/lib/io.mjs'

export const SKILL_CATEGORIES = ['attack', 'element', 'defense', 'resistance', 'utility', 'other']
export const ELEMENT_TYPES = ['fire', 'water', 'thunder', 'ice', 'dragon', 'poison', 'paralysis', 'sleep', 'blast']
/** Colour stone ids that have a StoneSwatch colour class. */
export const STONE_COLOURS = ['red', 'blue', 'black', 'white', 'yellow', 'sky']

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SNAKE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/
const ICON_KEY = /^[a-z0-9_-]+$/

/** Canonical key order of each record type (the sync writes keys in this order). */
const SKILL_FIELDS = ['id', 'name', 'nameEn', 'description', 'maxLevel', 'category', 'levels']
const ARMOR_FIELDS = ['id', 'name', 'nameEn', 'setName', 'setNameEn', 'part', 'defense', 'skills', 'driftstoneSlots', 'image']
const WEAPON_FIELDS = ['id', 'name', 'nameEn', 'type', 'attack', 'element', 'affinity', 'spSkill', 'skills', 'image']
const STONE_FIELDS = ['id', 'name', 'prime', 'skillIds']

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const isStr = v => typeof v === 'string'
const isText = v => typeof v === 'string' && v.trim() !== ''
const isInt = v => Number.isInteger(v)
const named = v => isObj(v) && isStr(v.name) && isStr(v.description)

/** Type-specific weapon fields (canonical order after WEAPON_FIELDS): the types carrying them and their shape. */
const WEAPON_EXTRAS = {
  chargingShots: [['bow'], v => Array.isArray(v) && v.every(isStr)],
  bottleType: [['bow'], v => v === null || isStr(v)],
  phial: [['switch-axe', 'charge-blade'], v => v === null || named(v)],
  shellingType: [['gunlance'], v => v === null || named(v)],
  ammo: [['light-bowgun', 'heavy-bowgun'], v => Array.isArray(v) && v.every(a => isObj(a) && isStr(a.name) && isInt(a.capacity) && isStr(a.recoil) && isStr(a.reload))],
  melodies: [['hunting-horn'], v => Array.isArray(v) && v.every(named)],
  kinsect: [['insect-glaive'], v => v === null || (isObj(v) && ['name', 'type', 'performanceType', 'attackSystem', 'bonus'].every(k => isStr(v[k])))],
}

function show(v) {
  const s = JSON.stringify(v)
  if (s === undefined) return String(v)
  return s.length > 60 ? `${s.slice(0, 57)}...` : s
}

function typeName(v) {
  return v === null ? 'null' : Array.isArray(v) ? 'an array' : typeof v
}

function sniff(b, n) {
  if (n === 0) return 'empty file'
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'PNG bytes'
  if (b[0] === 0xff && b[1] === 0xd8) return 'JPEG bytes'
  if (b[0] === 0x3c) return 'HTML/XML bytes'
  return 'unknown bytes'
}

/** null when `abs` is a RIFF/WEBP file that is not truncated, 'missing' when absent, else a short problem description. */
function inspectWebp(abs) {
  let fd
  try {
    fd = openSync(abs, 'r')
  } catch (e) {
    return e.code === 'ENOENT' || e.code === 'ENOTDIR' ? 'missing' : `is unreadable (${e.code})`
  }
  try {
    const stat = fstatSync(fd)
    if (!stat.isFile()) return 'is not a regular file'
    const head = Buffer.alloc(12)
    const n = readSync(fd, head, 0, 12, 0)
    if (n < 12 || head.toString('latin1', 0, 4) !== 'RIFF' || head.toString('latin1', 8, 12) !== 'WEBP') {
      return `is not a WebP file (${sniff(head, n)})`
    }
    // A short file is a broken (partial) download; trailing bytes are harmless, browsers ignore them
    const declared = head.readUInt32LE(4) + 8
    if (declared > stat.size) return `is truncated (RIFF header declares ${declared} bytes, file has ${stat.size})`
    return null
  } catch (e) {
    return `is unreadable (${e.code ?? e.message})`
  } finally {
    closeSync(fd)
  }
}

/** Human-readable form of a finding: "<file> <record id>: <message>". */
export function formatFinding(f) {
  return `${f.file}${f.id ? ` ${f.id}` : ''}: ${f.message}`
}

/**
 * Validate the data files in `dataDir` (and the images they reference under `publicDir`).
 * `pendingImages` lists images that are about to be downloaded ('public/images/...' or '/images/...'):
 * they are not required to exist yet and are counted in stats.images.pending.
 * @returns {{ errors: string[], warnings: string[], stats: object, findings: {level, code, file, id, message}[] }}
 */
export function validateData({ dataDir = join(ROOT, 'data'), publicDir = join(ROOT, 'public'), pendingImages = [] } = {}) {
  const started = performance.now()
  dataDir = resolve(dataDir)
  publicDir = resolve(publicDir)
  const pending = new Set([...pendingImages].map(p => `/${String(p).replace(/^\/+/, '').replace(/^public\//, '')}`))

  const findings = []
  const reporter = level => (code, file, id, message) => findings.push({ level, code, file, id: id ?? null, message })
  const error = reporter('error')
  const warn = reporter('warning')

  /** Read and parse data/<rel>; reports and returns undefined when missing, invalid or of the wrong shape. */
  function load(rel, shape) {
    const file = `data/${rel}`
    let raw
    try {
      raw = readFileSync(join(dataDir, rel), 'utf8')
    } catch (e) {
      error('FILE_MISSING', file, null, e.code === 'ENOENT' ? 'file is missing' : `cannot read file (${e.code ?? e.message})`)
      return undefined
    }
    let data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      error('FILE_INVALID_JSON', file, null, `invalid JSON: ${e.message}`)
      return undefined
    }
    if (shape === 'array' ? !Array.isArray(data) : !isObj(data)) {
      error('FILE_SHAPE', file, null, `expected a JSON ${shape}, got ${typeName(data)}`)
      return undefined
    }
    if (formatJson(data) !== raw) warn('FILE_FORMAT', file, null, 'not in the canonical layout (2-space indent, trailing newline); the next sync will reformat it')
    return data
  }

  const label = (rec, i) => (isObj(rec) && isText(rec.id) ? rec.id : `[${i}]`)

  /** Required field check: reports missing/invalid and returns whether the value is valid. */
  function need(rec, key, ok, file, id, expected) {
    if (!(key in rec)) {
      error('FIELD_INVALID', file, id, `missing field "${key}"`)
      return false
    }
    if (!ok(rec[key])) {
      error('FIELD_INVALID', file, id, `"${key}" must be ${expected}, got ${show(rec[key])}`)
      return false
    }
    return true
  }

  /** Warn about unknown fields and about known fields out of canonical order. */
  function checkKeys(rec, canonical, file, id, at = '') {
    const keys = Object.keys(rec)
    const prefix = at ? `${at}: ` : ''
    const unknown = keys.filter(k => !canonical.includes(k))
    if (unknown.length) warn('FIELD_UNKNOWN', file, id, `${prefix}unexpected field(s) ${unknown.join(', ')}`)
    const known = keys.filter(k => canonical.includes(k))
    const ordered = canonical.filter(k => known.includes(k))
    if (known.join() !== ordered.join()) warn('FIELD_ORDER', file, id, `${prefix}field order ${known.join(',')} differs from canonical ${ordered.join(',')}`)
  }

  const imageResults = new Map()
  const imageStats = { checked: 0, missing: 0, invalid: 0, pending: 0, orphans: 0 }
  /** Inspect public/<rel> once; returns null (ok or pending), 'missing' or a problem description. */
  function checkImage(rel) {
    if (imageResults.has(rel)) return imageResults.get(rel)
    let problem = null
    if (pending.has(rel)) imageStats.pending++
    else {
      problem = inspectWebp(join(publicDir, rel))
      imageStats.checked++
      if (problem === 'missing') imageStats.missing++
      else if (problem) imageStats.invalid++
    }
    imageResults.set(rel, problem)
    return problem
  }

  const referencedImages = new Set()
  /** Armor/weapon image: must be exactly /images/<dir>/<id>.webp and a valid WebP file. */
  function checkRecordImage(rec, dir, file, id, idOk) {
    if (!need(rec, 'image', isStr, file, id, 'a string')) return
    referencedImages.add(rec.image)
    if (!idOk) return
    const expected = `/images/${dir}/${rec.id}.webp`
    if (rec.image !== expected) {
      error('IMAGE_PATH', file, id, `image is ${show(rec.image)}, expected "${expected}"`)
      return
    }
    const problem = checkImage(expected)
    if (problem === 'missing') error('IMAGE_MISSING', file, id, `public${expected} does not exist`)
    else if (problem) error('IMAGE_INVALID', file, id, `public${expected} ${problem}`)
  }

  // ── skills.json ──
  const SKILLS_FILE = 'data/skills.json'
  const skillsData = load('skills.json', 'array')
  const skillsLoaded = skillsData !== undefined
  if (skillsData?.length === 0) error('FILE_EMPTY', SKILLS_FILE, null, 'no skills')
  const skillById = new Map()
  const skillIdsByName = new Map()
  const categoryCounts = {}
  const skillList = skillsData ?? []
  skillList.forEach((s, i) => {
    const id = label(s, i)
    if (!isObj(s)) return error('RECORD_SHAPE', SKILLS_FILE, id, `record must be an object, got ${typeName(s)}`)
    checkKeys(s, SKILL_FIELDS, SKILLS_FILE, id)
    if (need(s, 'id', v => isStr(v) && KEBAB.test(v), SKILLS_FILE, id, 'a kebab-case string')) {
      if (skillById.has(s.id)) error('ID_DUPLICATE', SKILLS_FILE, id, 'duplicate skill id')
      else skillById.set(s.id, s)
    }
    if (need(s, 'name', isText, SKILLS_FILE, id, 'a non-empty string')) {
      skillIdsByName.set(s.name, [...(skillIdsByName.get(s.name) ?? []), id])
    }
    if (need(s, 'nameEn', isStr, SKILLS_FILE, id, 'a string') && !isText(s.nameEn)) warn('NAME_EN_EMPTY', SKILLS_FILE, id, 'nameEn is empty')
    if (need(s, 'description', isStr, SKILLS_FILE, id, 'a string') && !isText(s.description)) {
      warn('DESCRIPTION_EMPTY', SKILLS_FILE, id, 'description is empty (the skill page and its SEO text show nothing)')
    }
    const maxOk = need(s, 'maxLevel', v => isInt(v) && v >= 1 && v <= 10, SKILLS_FILE, id, 'an integer 1..10')
    if (need(s, 'category', v => SKILL_CATEGORIES.includes(v), SKILLS_FILE, id, `one of ${SKILL_CATEGORIES.join(', ')}`)) {
      categoryCounts[s.category] = (categoryCounts[s.category] ?? 0) + 1
      if (s.category === 'other') warn('SKILL_CATEGORY_OTHER', SKILLS_FILE, id, 'category "other" is not reachable from the skill category tabs or the auto-build picker')
    }
    if (need(s, 'levels', Array.isArray, SKILLS_FILE, id, 'an array')) {
      if (maxOk && s.levels.length !== s.maxLevel) error('SKILL_LEVELS', SKILLS_FILE, id, `levels has ${s.levels.length} entries but maxLevel is ${s.maxLevel}`)
      s.levels.forEach((l, j) => {
        if (!isObj(l)) return error('SKILL_LEVELS', SKILLS_FILE, id, `levels[${j}] must be an object, got ${typeName(l)}`)
        checkKeys(l, ['level', 'effect'], SKILLS_FILE, id, `levels[${j}]`)
        if (l.level !== j + 1) error('SKILL_LEVELS', SKILLS_FILE, id, `levels[${j}].level is ${show(l.level)}, expected ${j + 1}`)
        if (!isText(l.effect)) error('SKILL_LEVELS', SKILLS_FILE, id, `levels[${j}].effect must be a non-empty string, got ${show(l.effect)}`)
      })
    }
  })
  for (const [name, ids] of skillIdsByName) {
    if (ids.length > 1) warn('SKILL_NAME_DUPLICATE', SKILLS_FILE, ids.join(', '), `zh name 「${name}」 is shared by ${ids.length} skills`)
  }

  // ── equipment skill references (strict: exact skills.json ids, no alias resolution) ──
  const usedSkills = new Set()
  const refStats = { armor: { total: 0, exact: 0 }, weapons: { total: 0, exact: 0 } }
  function checkSkillRefs(rec, kind, file, id) {
    if (!need(rec, 'skills', Array.isArray, file, id, 'an array')) return
    const allowed = kind === 'weapons' ? ['skillId', 'level', 'requiredCustomEnhancementLevel'] : ['skillId', 'level']
    const seen = new Set()
    rec.skills.forEach((ref, j) => {
      const at = `skills[${j}]`
      if (!isObj(ref)) return error('SKILL_REF_INVALID', file, id, `${at} must be an object, got ${typeName(ref)}`)
      checkKeys(ref, allowed, file, id, at)
      if (!isInt(ref.level) || ref.level < 1) error('SKILL_REF_INVALID', file, id, `${at}.level must be an integer >= 1, got ${show(ref.level)}`)
      if ('requiredCustomEnhancementLevel' in ref && !(isInt(ref.requiredCustomEnhancementLevel) && ref.requiredCustomEnhancementLevel >= 1)) {
        error('SKILL_REF_INVALID', file, id, `${at}.requiredCustomEnhancementLevel must be an integer >= 1, got ${show(ref.requiredCustomEnhancementLevel)}`)
      }
      if (!isText(ref.skillId)) return error('SKILL_REF_INVALID', file, id, `${at}.skillId must be a non-empty string, got ${show(ref.skillId)}`)
      refStats[kind].total++
      if (seen.has(ref.skillId)) error('SKILL_REF_DUPLICATE', file, id, `${at}: skill "${ref.skillId}" is listed more than once`)
      seen.add(ref.skillId)
      if (!skillsLoaded) return
      const skill = skillById.get(ref.skillId)
      if (!skill) {
        const guess = ref.skillId.toLowerCase().replace(/_/g, '-')
        const hint = guess !== ref.skillId && skillById.has(guess) ? ` (canonical id would be "${guess}")` : ''
        return error('SKILL_REF_UNKNOWN', file, id, `${at}.skillId "${ref.skillId}" is not a skills.json id${hint}`)
      }
      refStats[kind].exact++
      usedSkills.add(skill.id)
      if (isInt(ref.level) && isInt(skill.maxLevel) && ref.level > skill.maxLevel) {
        warn('SKILL_LEVEL_OVER_MAX', file, id, `${at}: ${skill.id} Lv${ref.level} exceeds its maxLevel ${skill.maxLevel}`)
      }
    })
  }

  // ── armor-monsters.json ──
  const MONSTERS_FILE = 'data/armor-monsters.json'
  const monsters = load('armor-monsters.json', 'object')
  if (monsters) {
    for (const [prefix, key] of Object.entries(monsters)) {
      if (!isStr(key) || !ICON_KEY.test(key)) error('MONSTERS_SHAPE', MONSTERS_FILE, prefix, `value must be a monster icon key ([a-z0-9_-]+), got ${show(key)}`)
    }
  }

  // ── armor ──
  const armorIds = new Map()
  const armorCounts = {}
  const sets = new Map()
  let armorComplete = true
  for (const part of ARMOR_PARTS) {
    const file = `data/armor/${part}.json`
    const list = load(`armor/${part}.json`, 'array')
    if (!list) {
      armorComplete = false
      continue
    }
    if (!list.length) error('FILE_EMPTY', file, null, 'no armor records')
    armorCounts[part] = list.length
    list.forEach((a, i) => {
      const id = label(a, i)
      if (!isObj(a)) return error('RECORD_SHAPE', file, id, `record must be an object, got ${typeName(a)}`)
      checkKeys(a, ARMOR_FIELDS, file, id)
      let idOk = need(a, 'id', v => isStr(v) && KEBAB.test(v), file, id, 'a kebab-case string')
      if (idOk) {
        if (armorIds.has(a.id)) error('ID_DUPLICATE', file, id, `duplicate armor id (also in data/armor/${armorIds.get(a.id)}.json)`)
        else armorIds.set(a.id, part)
        if (!a.id.endsWith(`-${part}`)) {
          error('ARMOR_ID_PART', file, id, `id must end with "-${part}" (set grouping and monster icons rely on the suffix)`)
          idOk = false
        }
      }
      need(a, 'name', isText, file, id, 'a non-empty string')
      if (need(a, 'nameEn', isStr, file, id, 'a string') && !isText(a.nameEn)) warn('NAME_EN_EMPTY', file, id, 'nameEn is empty')
      const setNameOk = need(a, 'setName', isStr, file, id, 'a string')
      if (setNameOk && (!isText(a.setName) || a.setName === '無')) warn('ARMOR_SETNAME_EMPTY', file, id, `setName is empty or a placeholder (${show(a.setName)})`)
      need(a, 'setNameEn', isStr, file, id, 'a string')
      need(a, 'part', v => v === part, file, id, `"${part}" (the file it lives in)`)
      need(a, 'defense', v => isInt(v) && v > 0, file, id, 'a positive integer')
      need(a, 'driftstoneSlots', v => isInt(v) && v >= 0 && v <= 3, file, id, 'an integer 0..3')
      checkSkillRefs(a, 'armor', file, id)
      checkRecordImage(a, 'armor', file, id, idOk)
      if (idOk) {
        const prefix = a.id.slice(0, -(part.length + 1))
        const set = sets.get(prefix) ?? { parts: [], setNames: new Map() }
        set.parts.push(part)
        if (setNameOk) set.setNames.set(part, a.setName)
        sets.set(prefix, set)
      }
    })
  }
  for (const [prefix, set] of sets) {
    const where = `${prefix}-*`
    const missing = ARMOR_PARTS.filter(p => !set.parts.includes(p))
    if (missing.length && armorComplete) warn('ARMOR_SET_INCOMPLETE', 'data/armor/*.json', where, `set has ${set.parts.length}/5 parts (missing ${missing.join(', ')})`)
    const names = [...new Set(set.setNames.values())]
    if (names.length > 1) {
      const detail = names.map(n => `${[...set.setNames].filter(([, v]) => v === n).map(([p]) => p).join('/')} 「${n}」`).join(', ')
      warn('ARMOR_SETNAME_INCONSISTENT', 'data/armor/*.json', where, `setName differs across parts: ${detail}`)
    }
    if (!monsters) continue
    const key = monsters[prefix]
    if (key === undefined) {
      warn('MONSTER_MISSING', MONSTERS_FILE, prefix, `no monster icon entry for armor set "${prefix}"`)
    } else if (isStr(key) && ICON_KEY.test(key)) {
      const rel = `/images/monsters/${key}.webp`
      const problem = checkImage(rel)
      if (problem === 'missing') warn('MONSTER_ICON_MISSING', MONSTERS_FILE, prefix, `public${rel} does not exist`)
      else if (problem) warn('MONSTER_ICON_INVALID', MONSTERS_FILE, prefix, `public${rel} ${problem}`)
    }
  }
  if (monsters && armorComplete) {
    for (const prefix of Object.keys(monsters)) {
      if (!sets.has(prefix)) warn('MONSTER_UNUSED', MONSTERS_FILE, prefix, 'entry does not match any armor set prefix')
    }
  }

  // ── weapons ──
  const weaponIds = new Map()
  const weaponCounts = {}
  let weaponsComplete = true
  const weaponFields = [...WEAPON_FIELDS, ...Object.keys(WEAPON_EXTRAS)]
  for (const type of WEAPON_TYPES) {
    const file = `data/weapons/${type}.json`
    const list = load(`weapons/${type}.json`, 'array')
    if (!list) {
      weaponsComplete = false
      continue
    }
    if (!list.length) error('FILE_EMPTY', file, null, 'no weapon records')
    weaponCounts[type] = list.length
    list.forEach((w, i) => {
      const id = label(w, i)
      if (!isObj(w)) return error('RECORD_SHAPE', file, id, `record must be an object, got ${typeName(w)}`)
      checkKeys(w, weaponFields, file, id)
      const idOk = need(w, 'id', v => isStr(v) && SNAKE.test(v), file, id, 'a snake_case string')
      if (idOk) {
        if (weaponIds.has(w.id)) error('ID_DUPLICATE', file, id, `duplicate weapon id (also in data/weapons/${weaponIds.get(w.id)}.json); weapon lookups scan all types`)
        else weaponIds.set(w.id, type)
      }
      if (need(w, 'name', isText, file, id, 'a non-empty string') && /\d\s*$/.test(w.name)) {
        warn('WEAPON_NAME_GRADE', file, id, `name 「${w.name}」 ends with a digit (leftover grade suffix?)`)
      }
      if (need(w, 'nameEn', isStr, file, id, 'a string') && !isText(w.nameEn)) warn('NAME_EN_EMPTY', file, id, 'nameEn is empty')
      need(w, 'type', v => v === type, file, id, `"${type}" (the file it lives in)`)
      need(w, 'attack', v => isInt(v) && v > 0, file, id, 'a positive integer')
      need(w, 'element', v => v === null || (isObj(v) && ELEMENT_TYPES.includes(v.type) && isInt(v.value) && v.value > 0 && Object.keys(v).length === 2),
        file, id, `null or {type: ${ELEMENT_TYPES.join('|')}, value: positive integer}`)
      need(w, 'affinity', isInt, file, id, 'an integer')
      need(w, 'spSkill', v => v === null || isStr(v), file, id, 'null or a string')
      checkSkillRefs(w, 'weapons', file, id)
      checkRecordImage(w, 'weapons', file, id, idOk)
      for (const [key, [types, ok]] of Object.entries(WEAPON_EXTRAS)) {
        const expected = types.includes(type)
        if (!(key in w)) {
          if (expected) warn('WEAPON_FIELD_TYPE', file, id, `missing "${key}" (expected on every ${type})`)
          continue
        }
        if (!expected) warn('WEAPON_FIELD_TYPE', file, id, `"${key}" is only expected on ${types.join('/')}`)
        if (!ok(w[key])) error('FIELD_INVALID', file, id, `"${key}" has an invalid shape: ${show(w[key])}`)
      }
    })
  }

  // ── driftstone-skills.json ──
  const DRIFT_FILE = 'data/driftstone-skills.json'
  const drift = load('driftstone-skills.json', 'object')
  const stoneCounts = { stones: 0, colour: 0, prime: 0, achievable: 0 }
  if (drift) {
    checkKeys(drift, ['stones', 'achievableSkillIds'], DRIFT_FILE, null)
    const stonesOk = need(drift, 'stones', Array.isArray, DRIFT_FILE, null, 'an array')
    const achievableOk = need(drift, 'achievableSkillIds', Array.isArray, DRIFT_FILE, null, 'an array')
    const stoneIds = new Set()
    const offered = new Set()
    let offeredComplete = stonesOk
    for (const [i, st] of (stonesOk ? drift.stones : []).entries()) {
      const id = label(st, i)
      if (!isObj(st)) {
        error('RECORD_SHAPE', DRIFT_FILE, id, `stone must be an object, got ${typeName(st)}`)
        offeredComplete = false
        continue
      }
      stoneCounts.stones++
      checkKeys(st, STONE_FIELDS, DRIFT_FILE, id)
      if (need(st, 'id', isText, DRIFT_FILE, id, 'a non-empty string')) {
        if (stoneIds.has(st.id)) error('ID_DUPLICATE', DRIFT_FILE, id, 'duplicate stone id')
        stoneIds.add(st.id)
      }
      const nameOk = need(st, 'name', isText, DRIFT_FILE, id, 'a non-empty string')
      const primeOk = need(st, 'prime', v => typeof v === 'boolean', DRIFT_FILE, id, 'a boolean')
      const skillsOk = need(st, 'skillIds', v => Array.isArray(v) && v.every(isText), DRIFT_FILE, id, 'an array of skill ids')
      if (skillsOk) {
        if (new Set(st.skillIds).size !== st.skillIds.length) warn('STONE_DUP_SKILL', DRIFT_FILE, id, 'skillIds contains duplicates')
        for (const sid of st.skillIds) {
          offered.add(sid)
          if (skillById.has(sid)) usedSkills.add(sid)
          else if (skillsLoaded) error('STONE_SKILL_UNKNOWN', DRIFT_FILE, id, `skillIds contains "${sid}", which is not a skills.json id`)
        }
      } else offeredComplete = false
      if (!primeOk || !isStr(st.id)) continue
      if (st.prime) {
        stoneCounts.prime++
        if (!KEBAB.test(st.id) || !st.id.endsWith('-prime')) error('STONE_PRIME_ID', DRIFT_FILE, id, 'prime stone id must be kebab-case and end with "-prime" (StoneSwatch relies on it)')
        if (skillsOk && st.skillIds.length !== 1) warn('STONE_PRIME_SKILLS', DRIFT_FILE, id, `prime stone carries ${st.skillIds.length} skills, expected exactly 1`)
        const inner = nameOk && st.name.match(/^漂流純石【(.+)】$/)
        if (nameOk && !inner) warn('STONE_PRIME_NAME', DRIFT_FILE, id, `name 「${st.name}」 does not follow 漂流純石【X】`)
        const skill = inner && skillsOk && st.skillIds.length === 1 && skillById.get(st.skillIds[0])
        if (skill && skill.name !== inner[1]) warn('STONE_PRIME_NAME', DRIFT_FILE, id, `name says 「${inner[1]}」 but its skill ${skill.id} is 「${skill.name}」`)
      } else {
        stoneCounts.colour++
        if (!STONE_COLOURS.includes(st.id)) error('STONE_COLOUR', DRIFT_FILE, id, `colour stone id must be one of ${STONE_COLOURS.join(', ')} (StoneSwatch colour classes)`)
        if (nameOk && !/^漂流石【(.+)】$/.test(st.name)) error('STONE_NAME', DRIFT_FILE, id, `name 「${st.name}」 does not match 漂流石【X】 (the filter label is parsed from it)`)
        if (skillsOk && !st.skillIds.length) warn('STONE_EMPTY', DRIFT_FILE, id, 'colour stone offers no skills')
      }
    }
    if (achievableOk) {
      const where = 'achievableSkillIds'
      const seen = new Set()
      for (const sid of drift.achievableSkillIds) {
        if (!isText(sid)) {
          error('ACHIEVABLE_MISMATCH', DRIFT_FILE, where, `entry ${show(sid)} is not a skill id`)
          continue
        }
        if (seen.has(sid)) error('ACHIEVABLE_MISMATCH', DRIFT_FILE, where, `"${sid}" is listed more than once`)
        seen.add(sid)
        if (skillById.has(sid)) usedSkills.add(sid)
        else if (skillsLoaded) error('ACHIEVABLE_MISMATCH', DRIFT_FILE, where, `"${sid}" is not a skills.json id`)
        if (offeredComplete && !offered.has(sid)) error('ACHIEVABLE_MISMATCH', DRIFT_FILE, where, `"${sid}" is not offered by any stone`)
      }
      stoneCounts.achievable = seen.size
      for (const sid of offered) {
        if (!seen.has(sid)) error('ACHIEVABLE_MISMATCH', DRIFT_FILE, where, `stone skill "${sid}" is missing (the driftstone picker and auto-build filter by this list)`)
      }
    }
  }

  // ── files nobody loads, orphan images, unused skills ──
  for (const [dir, names] of [['armor', ARMOR_PARTS], ['weapons', WEAPON_TYPES]]) {
    let entries = []
    try {
      entries = readdirSync(join(dataDir, dir))
    } catch {}
    for (const f of entries) {
      if (!f.startsWith('.') && !names.some(n => f === `${n}.json`)) warn('FILE_UNEXPECTED', `data/${dir}/${f}`, null, 'is not one of the files the app loads')
    }
  }
  for (const [dir, complete, owner] of [['armor', armorComplete, 'armor'], ['weapons', weaponsComplete, 'weapon']]) {
    if (!complete) continue
    let entries = []
    try {
      entries = readdirSync(join(publicDir, 'images', dir))
    } catch {}
    for (const f of entries) {
      const rel = `/images/${dir}/${f}`
      if (f.startsWith('.') || referencedImages.has(rel)) continue
      imageStats.orphans++
      warn('IMAGE_ORPHAN', `public${rel}`, null, `not referenced by any ${owner} record`)
    }
  }
  if (skillsLoaded && armorComplete && weaponsComplete && drift) {
    for (const s of skillById.values()) {
      if (!usedSkills.has(s.id)) warn('SKILL_UNUSED', SKILLS_FILE, s.id, 'not referenced by any armor, weapon or driftstone')
    }
  }

  const errors = findings.filter(f => f.level === 'error')
  const warnings = findings.filter(f => f.level === 'warning')
  const byCode = list => {
    const counts = {}
    for (const f of list) counts[f.code] = (counts[f.code] ?? 0) + 1
    return counts
  }
  const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0)
  const stats = {
    dataDir,
    publicDir,
    skills: { total: skillById.size, categories: categoryCounts, unused: warnings.filter(f => f.code === 'SKILL_UNUSED').length },
    armor: { total: sum(armorCounts), sets: sets.size, parts: armorCounts },
    weapons: { total: sum(weaponCounts), types: weaponCounts },
    driftstones: stoneCounts,
    armorMonsters: monsters ? Object.keys(monsters).length : 0,
    skillRefs: refStats,
    images: imageStats,
    errorsByCode: byCode(errors),
    warningsByCode: byCode(warnings),
    durationMs: Math.round(performance.now() - started),
  }
  return { errors: errors.map(formatFinding), warnings: warnings.map(formatFinding), stats, findings }
}

// ── CLI ──

const USAGE = 'Usage: node scripts/validate-data.mjs [--data-dir DIR] [--public-dir DIR] [--json] [--all]'
const SAMPLE = 10

function parseArgs(argv) {
  const opts = { json: false, all: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s)
    if (flag === '--json') opts.json = true
    else if (flag === '--all') opts.all = true
    else if (flag === '-h' || flag === '--help') opts.help = true
    else if (flag === '--data-dir' || flag === '--public-dir') {
      const value = inline ?? argv[++i]
      if (!value) throw new Error(`${flag} needs a directory`)
      opts[flag === '--data-dir' ? 'dataDir' : 'publicDir'] = resolve(value)
    } else throw new Error(`unknown argument: ${argv[i]}`)
  }
  return opts
}

function printGroup(title, list, all) {
  console.log(`\n${title}: ${list.length}`)
  const groups = new Map()
  for (const f of list) groups.set(f.code, [...(groups.get(f.code) ?? []), f])
  for (const [code, items] of groups) {
    console.log(`  ${code} (${items.length})`)
    for (const f of all ? items : items.slice(0, SAMPLE)) console.log(`    ${formatFinding(f)}`)
    if (!all && items.length > SAMPLE) console.log(`    ... ${items.length - SAMPLE} more (run with --all)`)
  }
}

function printSummary({ stats: s, findings }, { all }) {
  const list = obj => Object.entries(obj).map(([k, v]) => `${k} ${v}`).join(', ')
  const ref = r => `${r.exact}/${r.total} exact`
  const d = s.driftstones
  console.log(`validate-data: ${s.dataDir} (images: ${s.publicDir})`)
  console.log(`  skills       ${s.skills.total} (${list(s.skills.categories)})`)
  console.log(`  armor        ${s.armor.total} in ${s.armor.sets} sets (${list(s.armor.parts)})`)
  console.log(`  weapons      ${s.weapons.total} across ${Object.keys(s.weapons.types).length} types`)
  console.log(`  driftstones  ${d.stones} stones (${d.colour} colour, ${d.prime} prime), ${d.achievable} achievable skills`)
  console.log(`  skill refs   armor ${ref(s.skillRefs.armor)}, weapons ${ref(s.skillRefs.weapons)}`)
  const im = s.images
  console.log(`  images       ${im.checked} checked: ${im.missing} missing, ${im.invalid} invalid, ${im.orphans} orphans${im.pending ? `, ${im.pending} pending download` : ''}`)
  const errors = findings.filter(f => f.level === 'error')
  const warnings = findings.filter(f => f.level === 'warning')
  if (errors.length) printGroup('ERRORS', errors, all)
  if (warnings.length) printGroup('WARNINGS', warnings, all)
  console.log(`\n${errors.length ? 'FAIL' : 'OK'}: ${errors.length} errors, ${warnings.length} warnings (${s.durationMs} ms)`)
}

function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (e) {
    console.error(`${e.message}\n${USAGE}`)
    process.exit(2)
  }
  if (opts.help) return console.log(USAGE)
  const result = validateData({ dataDir: opts.dataDir, publicDir: opts.publicDir })
  if (opts.json) console.log(JSON.stringify(result, null, 2))
  else printSummary(result, opts)
  process.exitCode = result.errors.length ? 1 : 0
}

const isCli = (() => {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
})()
if (isCli) main()

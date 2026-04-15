/**
 * Scrape weapon data from monsterhunternow.com/zh/weapons
 *
 * Usage: node scripts/scrape-weapons.mjs
 *
 * Reads weapon URLs from the existing Playwright snapshot, visits each weapon
 * detail page via fetch(), parses max-level stats (name, attack, affinity,
 * element, SP技能, 裝備技能) and type-specific special fields, then writes
 * 14 JSON files to data/weapons/.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Official site URL suffix → our slug + Chinese name
const TYPE_MAP = {
  greatsword:   { slug: 'great-sword',      name: '大劍' },
  longsword:    { slug: 'long-sword',       name: '太刀' },
  swordshield:  { slug: 'sword-and-shield', name: '單手劍' },
  dualblades:   { slug: 'dual-blades',      name: '雙劍' },
  hammer:       { slug: 'hammer',           name: '大錘' },
  huntinghorn:  { slug: 'hunting-horn',     name: '狩獵笛' },
  lance:        { slug: 'lance',            name: '長槍' },
  gunlance:     { slug: 'gunlance',         name: '銃槍' },
  switchaxe:    { slug: 'switch-axe',       name: '斬擊斧' },
  chargeblade:  { slug: 'charge-blade',     name: '充能斧' },
  insectglaive: { slug: 'insect-glaive',    name: '操蟲棍' },
  lightbowgun:  { slug: 'light-bowgun',     name: '輕弩槍' },
  heavybowgun:  { slug: 'heavy-bowgun',     name: '重弩槍' },
  bow:          { slug: 'bow',              name: '弓' },
}

const TYPE_SUFFIXES = Object.keys(TYPE_MAP).sort((a, b) => b.length - a.length)

function getWeaponType(urlSlug) {
  for (const suffix of TYPE_SUFFIXES) {
    if (urlSlug.endsWith('_' + suffix) || urlSlug === suffix) {
      return { suffix, ...TYPE_MAP[suffix] }
    }
  }
  return null
}

function extractWeaponUrls() {
  const snapshotPath = join(ROOT, '.playwright-mcp/page-2026-04-13T16-35-59-158Z.yml')
  const content = readFileSync(snapshotPath, 'utf-8')
  const seen = new Set()
  const results = []
  const regex = /\/url: \/zh\/weapons\/([a-z][a-z0-9_]+)/g
  let m
  while ((m = regex.exec(content)) !== null) {
    const urlSlug = m[1]
    if (seen.has(urlSlug)) continue
    seen.add(urlSlug)
    const typeInfo = getWeaponType(urlSlug)
    if (typeInfo) results.push({ urlSlug, ...typeInfo })
  }
  return results
}

const HTML_ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }
const strip = s => s
  .replace(/<[^>]+>/g, '')
  .replace(/&[a-z#0-9]+;/gi, e => HTML_ENTITIES[e] ?? e)
  .replace(/\s+/g, ' ')
  .trim()

// ─── Stats table parser ────────────────────────────────────────────────────

function parseStatsTable(html) {
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) return null

  const allRows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]

  let maxAttack = 0
  let affinity = 0
  let element = null
  let spSkill = null
  let skillId = null
  let skillLevel = 0
  let firstRow = true

  for (const rowMatch of allRows) {
    const rowHtml = rowMatch[1]
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1])
    if (cells.length === 0) continue

    // Max-level summary row: 2 cells, first matches "10 Lv 5" pattern
    if (cells.length === 2) {
      const firstText = strip(cells[0])
      if (/^\d+\s*Lv\s*\d+$/.test(firstText)) {
        const atk = parseInt(strip(cells[1])) || 0
        if (atk > 0) maxAttack = atk
        continue
      }
    }

    // Normal rows: attack is always cells[2]
    if (cells.length >= 3) {
      const atk = parseInt(strip(cells[2])) || 0
      if (atk > maxAttack) maxAttack = atk
    }

    // Parse each cell by content type
    for (const cell of cells) {
      const text = strip(cell)

      // Affinity: percentage, no link (only meaningful from first row)
      if (firstRow && /%/.test(text) && !/<a/.test(cell) && !text.startsWith('【SP】')) {
        const aff = parseInt(text.replace('%', ''))
        if (!isNaN(aff)) affinity = aff
      }

      // Element: img src contains element_XXX.png (only meaningful from first row)
      if (firstRow) {
        const elementImgMatch = cell.match(/element_([a-z]+)\.png/i)
        if (elementImgMatch) {
          const val = parseInt(text) || 0
          if (val > 0) {
            element = { type: elementImgMatch[1].toLowerCase(), value: val }
          }
        }
      }

      // SP技能: text starts with 【SP】 (keep last = highest level)
      if (text.startsWith('【SP】')) {
        spSkill = text
      }

      // 裝備技能: cell contains link to /zh/skills/
      const skillLinkMatch = cell.match(/\/zh\/skills\/([a-z0-9_]+)/)
      if (skillLinkMatch) {
        const id = skillLinkMatch[1]
        const lvMatch = text.match(/Lv\s*(\d+)/i)
        const lv = lvMatch ? parseInt(lvMatch[1]) : 1
        if (!skillId || lv >= skillLevel) {
          skillId = id
          skillLevel = lv
        }
      }
    }

    firstRow = false
  }

  const skills = skillId ? [{ skillId, level: skillLevel }] : []
  return { maxAttack, affinity, element, spSkill, skills }
}

// ─── Section helpers ───────────────────────────────────────────────────────

/** Find the <table> immediately following a heading with the given text */
function getSectionTable(html, headingText) {
  // Match <h3>headingText</h3> ... <table> ... </table>
  const escaped = headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(
    `<h3[^>]*>[^<]*${escaped}[^<]*<\\/h3>[\\s\\S]*?(<table[\\s\\S]*?<\\/table>)`,
    'i'
  )
  const m = html.match(regex)
  return m ? m[1] : null
}

/** Parse ammo table (輕/重弩：彈藥種類) */
function parseAmmo(html) {
  const table = getSectionTable(html, '彈藥種類')
  if (!table) return null

  const tbodyMatch = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) return null

  const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const ammo = []

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1])
    if (cells.length < 4) continue

    // First cell contains an <h3> with the ammo name
    const nameMatch = cells[0].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
    const name = nameMatch ? strip(nameMatch[1]) : strip(cells[0]).split(' ')[0]
    const capacity = parseInt(strip(cells[1])) || 0
    const recoil = strip(cells[2])
    const reload = strip(cells[3])

    if (name) ammo.push({ name, capacity, recoil, reload })
  }

  return ammo.length > 0 ? ammo : null
}

/** Parse charging shots (弓：蓄力射擊) */
function parseChargingShots(html) {
  const table = getSectionTable(html, '蓄力射擊')
  if (!table) return null

  const tbodyMatch = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) return null

  const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const shots = []

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1])
    if (cells.length === 0) continue

    // Name is in <h3> inside first cell
    const nameMatch = cells[0].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
    const name = nameMatch ? strip(nameMatch[1]) : strip(cells[0])
    if (name) shots.push(name)
  }

  return shots.length > 0 ? shots : null
}

/** Parse bottle type for bow (弓：瓶類型 - may be text "無" or a table) */
function parseBottleType(html) {
  // Try table format first
  const table = getSectionTable(html, '瓶類型')
  if (table) {
    const tbodyMatch = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
    if (tbodyMatch) {
      const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
      for (const row of rows) {
        const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => strip(m[1]))
        if (cells.length >= 1 && cells[0]) return cells[0]
      }
    }
  }

  // Try plain text format: <h3>瓶類型</h3><p>無</p>
  const textMatch = html.match(/<h3[^>]*>[^<]*瓶類型[^<]*<\/h3>\s*<p[^>]*>([^<]+)<\/p>/i)
  if (textMatch) return strip(textMatch[1])

  return null
}

/** Parse phial or shelling type (斬擊斧/充能斧：瓶類型 / 銃槍：砲擊類型) */
function parsePhialOrShelling(html, headingText) {
  const table = getSectionTable(html, headingText)
  if (!table) return null

  const tbodyMatch = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) return null

  const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => strip(m[1]))
    if (cells.length >= 2 && cells[0]) {
      return { name: cells[0], description: cells[1] || '' }
    }
    if (cells.length === 1 && cells[0]) {
      return { name: cells[0], description: '' }
    }
  }

  return null
}

/** Parse melodies (狩獵笛：旋律效果) */
function parseMelodies(html) {
  const table = getSectionTable(html, '旋律效果')
  if (!table) return null

  const tbodyMatch = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) return null

  const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const melodies = []

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => strip(m[1]))
    // 3 cols: icon, name, description — or 2 cols: name, description
    if (cells.length >= 3) {
      // cells[0] is icon (img only), cells[1] = name, cells[2] = description
      const name = cells[1]
      const description = cells[2]
      if (name) melodies.push({ name, description: description || '' })
    } else if (cells.length === 2 && cells[0]) {
      melodies.push({ name: cells[0], description: cells[1] || '' })
    }
  }

  return melodies.length > 0 ? melodies : null
}

/** Parse kinsect (操蟲棍：獵蟲) */
function parseKinsect(html) {
  // Extract kinsect name from <h3>獵蟲：NAME</h3>
  const nameMatch = html.match(/獵蟲[：:]\s*([^<"]+?)\s*</)
  if (!nameMatch) return null
  const name = nameMatch[1].trim()

  const extractH4 = (label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`${escaped}[：:]\\s*([^<"]+?)\\s*(?:<|$)`)
    const m = html.match(regex)
    return m ? m[1].trim() : ''
  }

  return {
    name,
    type: extractH4('獵蟲類型'),
    performanceType: extractH4('性能類型'),
    attackSystem: extractH4('攻擊系統'),
    bonus: extractH4('獵蟲加成'),
  }
}

// ─── Main weapon parser ────────────────────────────────────────────────────

function parseWeaponHtml(html, urlSlug, typeSlug) {
  // Weapon name from <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const name = titleMatch
    ? titleMatch[1].replace(/\s*[–—-].*$/, '').trim()
    : urlSlug

  const stats = parseStatsTable(html)
  if (!stats) return null

  const weapon = {
    id: urlSlug,
    name,
    nameEn: '',
    type: typeSlug,
    attack: stats.maxAttack,
    element: stats.element,
    affinity: stats.affinity,
    spSkill: stats.spSkill,
    skills: stats.skills,
    image: '',
  }

  // Type-specific fields
  if (typeSlug === 'light-bowgun' || typeSlug === 'heavy-bowgun') {
    const ammo = parseAmmo(html)
    if (ammo) weapon.ammo = ammo
  }

  if (typeSlug === 'bow') {
    const chargingShots = parseChargingShots(html)
    if (chargingShots) weapon.chargingShots = chargingShots
    const bottleType = parseBottleType(html)
    weapon.bottleType = bottleType
  }

  if (typeSlug === 'switch-axe' || typeSlug === 'charge-blade') {
    const phial = parsePhialOrShelling(html, '瓶類型')
    if (phial) weapon.phial = phial
  }

  if (typeSlug === 'gunlance') {
    const shellingType = parsePhialOrShelling(html, '砲擊類型')
    if (shellingType) weapon.shellingType = shellingType
  }

  if (typeSlug === 'hunting-horn') {
    const melodies = parseMelodies(html)
    if (melodies) weapon.melodies = melodies
  }

  if (typeSlug === 'insect-glaive') {
    const kinsect = parseKinsect(html)
    if (kinsect) weapon.kinsect = kinsect
  }

  return weapon
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────

async function fetchWithRetry(url, retries = 3, delayMs = 1000) {
  const headers = {
    'Accept': 'text/html',
    'Accept-Language': 'zh-TW,zh;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  }
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
}

async function processBatch(batch) {
  return Promise.all(batch.map(async ({ urlSlug, slug: typeSlug }) => {
    const url = `https://monsterhunternow.com/zh/weapons/${urlSlug}`
    try {
      const html = await fetchWithRetry(url)
      const weapon = parseWeaponHtml(html, urlSlug, typeSlug)
      if (!weapon) {
        console.warn(`  ⚠ Could not parse: ${urlSlug}`)
        return null
      }
      return weapon
    } catch (err) {
      console.error(`  ✗ Failed: ${urlSlug} — ${err.message}`)
      return null
    }
  }))
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Extracting weapon URLs from snapshot...')
  const weapons = extractWeaponUrls()
  console.log(`Found ${weapons.length} weapons across 14 types\n`)

  // Group by type slug
  const byType = {}
  for (const w of weapons) {
    if (!byType[w.slug]) byType[w.slug] = []
    byType[w.slug].push(w)
  }

  for (const [typeSlug, typeWeapons] of Object.entries(byType)) {
    const typeName = TYPE_MAP[typeWeapons[0].suffix]?.name || typeSlug
    console.log(`Processing ${typeName} (${typeSlug}): ${typeWeapons.length} weapons`)

    const results = []
    const BATCH_SIZE = 10

    for (let i = 0; i < typeWeapons.length; i += BATCH_SIZE) {
      const batch = typeWeapons.slice(i, i + BATCH_SIZE)
      process.stdout.write(`  batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(typeWeapons.length / BATCH_SIZE)}...`)
      const batchResults = await processBatch(batch)
      results.push(...batchResults.filter(Boolean))
      process.stdout.write(` done (${batchResults.filter(Boolean).length}/${batch.length})\n`)
      if (i + BATCH_SIZE < typeWeapons.length) {
        await new Promise(r => setTimeout(r, 300))
      }
    }

    const outPath = join(ROOT, 'data/weapons', `${typeSlug}.json`)
    writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`  → Wrote ${results.length} weapons to data/weapons/${typeSlug}.json\n`)
  }

  console.log('Done!')
}

main().catch(console.error)

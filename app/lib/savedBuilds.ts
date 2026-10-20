/**
 * Saved builds kept in this browser ("我的配裝") — pure TS: parsing, import/export
 * and spotting builds that a data sync has partly invalidated.
 *
 * A saved build stores the same short params as a share link (w, h, c, a, wa, l for
 * gear; dh, dc, da, dw, dl for driftstones), so loading one is opening /build?<params>.
 */

export const SAVED_BUILDS_LIMIT = 50
export const EXPORT_APP = 'mhn-builder'
export const EXPORT_VERSION = 1

export interface SavedBuild {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  params: Record<string, string>
}

export interface ExportFile {
  app: typeof EXPORT_APP
  version: number
  exportedAt: string
  builds: SavedBuild[]
}

type ArmorPart = 'head' | 'chest' | 'arms' | 'waist' | 'legs'

const GEAR_LABELS: Record<string, string> = { w: '武器', h: '頭部', c: '胸部', a: '腕部', wa: '腰部', l: '腿部' }
// Armor param -> its part and the param holding its driftstones
const ARMOR_PARAMS: [string, ArmorPart, string][] = [
  ['h', 'head', 'dh'],
  ['c', 'chest', 'dc'],
  ['a', 'arms', 'da'],
  ['wa', 'waist', 'dw'],
  ['l', 'legs', 'dl'],
]
const PARAM_KEYS = new Set(['w', ...ARMOR_PARAMS.flatMap(([gear, , drift]) => [gear, drift])])

/** Keep only well-formed records; anything else in storage or an import is dropped. */
export function sanitizeBuild(raw: unknown): SavedBuild | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id || typeof r.name !== 'string') return null
  if (!r.params || typeof r.params !== 'object') return null
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(r.params as Record<string, unknown>)) {
    if (PARAM_KEYS.has(k) && typeof v === 'string' && v) params[k] = v
  }
  if (!Object.keys(params).length) return null
  const createdAt = typeof r.createdAt === 'number' ? r.createdAt : Date.now()
  return {
    id: r.id,
    name: r.name.trim().slice(0, 40) || '未命名配裝',
    createdAt,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : createdAt,
    params,
  }
}

function sanitizeAll(list: unknown[]): SavedBuild[] {
  return list.map(sanitizeBuild).filter((b): b is SavedBuild => b !== null)
}

export function parseStoredBuilds(raw: string | null): SavedBuild[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? sanitizeAll(data).slice(0, SAVED_BUILDS_LIMIT) : []
  } catch {
    return []
  }
}

export function toExportFile(builds: SavedBuild[], now = new Date()): ExportFile {
  return { app: EXPORT_APP, version: EXPORT_VERSION, exportedAt: now.toISOString(), builds }
}

/** Parse an exported file's text; throws with a player-facing message when it is not one. */
export function parseExportFile(text: string): SavedBuild[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('這不是配裝備份檔（無法讀取 JSON）')
  }
  const file = data as Partial<ExportFile> | null
  if (!file || file.app !== EXPORT_APP || !Array.isArray(file.builds)) {
    throw new Error('這不是最強獵人的配裝備份檔')
  }
  return sanitizeAll(file.builds)
}

/**
 * Add imported builds after the existing ones. A build whose id is already saved
 * replaces it only when the import is newer. Stops at the limit.
 */
export function mergeImported(existing: SavedBuild[], imported: SavedBuild[]) {
  const builds = [...existing]
  let added = 0
  let updated = 0
  let skipped = 0
  for (const b of imported) {
    const i = builds.findIndex(x => x.id === b.id)
    if (i !== -1) {
      if (b.updatedAt > builds[i]!.updatedAt) {
        builds[i] = b
        updated++
      } else skipped++
    } else if (builds.length < SAVED_BUILDS_LIMIT) {
      builds.push(b)
      added++
    } else skipped++
  }
  return { builds, added, updated, skipped }
}

export interface GearLookup {
  hasWeapon(id: string): boolean
  /** Driftstone slots of an armor piece, or undefined when the piece no longer exists. */
  armorSlots(part: ArmorPart, id: string): number | undefined
  isDriftstoneSkill(id: string): boolean
}

/**
 * What no longer loads as saved: pieces that left the data, and driftstones that
 * would be dropped (skill gone from driftstones, or beyond the piece's slots).
 */
export function staleParts(params: Record<string, string>, gear: GearLookup): string[] {
  const out: string[] = []
  if (params.w && !gear.hasWeapon(params.w)) out.push(GEAR_LABELS.w!)
  for (const [key, part, driftKey] of ARMOR_PARAMS) {
    const id = params[key]
    if (!id) continue
    const slots = gear.armorSlots(part, id)
    if (slots === undefined) {
      out.push(GEAR_LABELS[key]!)
      continue
    }
    const stones = (params[driftKey] ?? '').split(',')
    if (stones.some((s, i) => s && (i >= slots || !gear.isDriftstoneSkill(s)))) {
      out.push(`${GEAR_LABELS[key]}漂流石`)
    }
  }
  return out
}

export function newBuildId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

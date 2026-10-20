/**
 * Hand-entered gear (config/extra-gear.json): event armor and weapons the official
 * site does not list. The sync merges official records as usual, then appends these
 * marked `source: "manual"`; manual records already in data/ are replaced wholesale,
 * so editing or removing one in the config is the only way to change it.
 */
import { join } from 'node:path'
import { mergeRecords } from './diff.mjs'
import { ROOT, readJson } from './io.mjs'

export const EXTRA_GEAR_FILE = join(ROOT, 'scripts/sync/config/extra-gear.json')

export function loadExtraGear(file = EXTRA_GEAR_FILE) {
  const raw = readJson(file)
  for (const key of ['armor', 'weapons']) {
    if (!Array.isArray(raw[key])) throw new Error(`extra-gear.json: "${key}" must be an array`)
  }
  const mark = r => ({ ...r, source: 'manual' })
  return { armor: raw.armor.map(mark), weapons: raw.weapons.map(mark) }
}

/**
 * mergeRecords() for the official records, then the manual ones appended.
 * @returns mergeRecords' result plus `manual` (ids written) , `removedManual` and `warnings`.
 */
export function mergeWithManual(currentList, officialList, manualList, label) {
  const officialIds = new Set(officialList.map(r => r.id))
  for (const m of manualList) {
    if (officialIds.has(m.id)) throw new Error(`extra-gear.json: ${label} ${m.id} uses an official id; manual ids must start with "ev-" / "ev_"`)
  }
  const manualIds = new Set(manualList.map(r => r.id))
  const currentOfficial = currentList.filter(r => r.source !== 'manual')
  const removedManual = currentList.filter(r => r.source === 'manual' && !manualIds.has(r.id))
  const merged = mergeRecords(currentOfficial, officialList)

  const byName = new Map(officialList.map(r => [r.name, r.id]))
  const warnings = manualList
    .filter(m => byName.has(m.name))
    .map(m => `手動 ${label} ${m.id}「${m.name}」官方已有同名的 ${byName.get(m.name)}：可改用官方資料並從 extra-gear.json 移除`)

  return {
    ...merged,
    list: [...merged.list, ...manualList],
    manual: manualList.map(r => `${r.id} ${r.name}`),
    removedManual: removedManual.map(r => `${r.id} ${r.name}`),
    warnings,
  }
}

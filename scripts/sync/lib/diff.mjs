import { jsonEqual } from './io.mjs'

/**
 * Merge freshly built official records into the current list.
 *
 * - Existing records keep their position (minimal diffs); their content is
 *   replaced by the official record.
 * - New official records are appended in official order.
 * - Records missing upstream are kept untouched (never deleted: their ids live
 *   in share URLs and saved builds) and reported in `keptMissingUpstream`.
 *
 * @returns {{ list: object[], added: object[], changed: {id: string, field: string, from: any, to: any}[], keptMissingUpstream: object[] }}
 */
export function mergeRecords(currentList, officialList, key = 'id') {
  const official = new Map(officialList.map(r => [r[key], r]))
  const currentIds = new Set(currentList.map(r => r[key]))
  const list = []
  const changed = []
  const keptMissingUpstream = []

  for (const cur of currentList) {
    const next = official.get(cur[key])
    if (!next) {
      keptMissingUpstream.push(cur)
      list.push(cur)
      continue
    }
    changed.push(...diffFields(cur, next, key))
    list.push(next)
  }
  const added = officialList.filter(r => !currentIds.has(r[key]))
  list.push(...added)
  return { list, added, changed, keptMissingUpstream }
}

/** Field-level differences between two versions of the same record. */
export function diffFields(before, after, key = 'id') {
  const out = []
  const fields = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const field of fields) {
    if (!jsonEqual(before[field], after[field])) {
      out.push({ id: after[key] ?? before[key], field, from: before[field], to: after[field] })
    }
  }
  return out
}

/**
 * Apply config/overrides.json entries for one dataset in place.
 * @returns {string[]} human-readable lines for the report
 */
export function applyOverrides(list, datasetOverrides = {}, key = 'id') {
  const applied = []
  const byId = new Map(list.map(r => [r[key], r]))
  for (const [id, fields] of Object.entries(datasetOverrides)) {
    if (id.startsWith('$')) continue
    const record = byId.get(id)
    if (!record) {
      applied.push(`${id}: override skipped (record not found)`)
      continue
    }
    for (const [field, value] of Object.entries(fields)) {
      record[field] = value
      applied.push(`${id}.${field} = ${JSON.stringify(value)}`)
    }
  }
  return applied
}

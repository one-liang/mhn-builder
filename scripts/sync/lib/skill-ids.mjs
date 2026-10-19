/**
 * Official skill kind (e.g. "RISING_TIDE") -> data/skills.json id (e.g. "battle-temper").
 *
 * The mapping lives in config/id-maps.json and only ever grows: skills.json ids
 * are persisted in share URLs and localStorage, so an existing entry is never
 * changed. Kinds the map does not know yet get the default id (slug with
 * underscores -> hyphens) and are recorded in `added` for the sync report.
 */

export const kindToSlug = kind => kind.toLowerCase()
export const defaultSkillId = kind => kindToSlug(kind).replace(/_/g, '-')

export function createSkillIdResolver(maps) {
  const added = []
  const excluded = new Set(maps.excludedSkillKinds ?? [])

  /** Assign (or look up) the skills.json id for a kind; used by the skills sync. */
  function assign(kind) {
    const slug = kindToSlug(kind)
    if (excluded.has(slug)) return null
    if (!maps.skillIds[slug]) {
      const id = defaultSkillId(kind)
      if (Object.values(maps.skillIds).includes(id)) {
        throw new Error(`Default skill id "${id}" for ${kind} collides with an existing id; add an explicit entry to config/id-maps.json`)
      }
      maps.skillIds[slug] = id
      added.push({ kind, slug, id })
    }
    return maps.skillIds[slug]
  }

  /** Resolve a kind referenced by equipment; throws if it was never assigned. */
  function resolve(kind, context) {
    const slug = kindToSlug(kind)
    if (excluded.has(slug)) {
      throw new Error(`${context} references skill ${kind}, which is listed in excludedSkillKinds — remove it from the list in config/id-maps.json`)
    }
    const id = maps.skillIds[slug]
    if (!id) throw new Error(`${context} references skill ${kind}, which is not in the official skill list`)
    return id
  }

  return { assign, resolve, added, isExcluded: kind => excluded.has(kindToSlug(kind)) }
}

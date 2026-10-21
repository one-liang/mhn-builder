/**
 * Skill families: a base skill and its variants, so pickers can keep them together
 * (攻擊 next to 攻擊．境界, 追擊 next to 追擊【毒】, the 高能強化【…】 set side by side).
 *
 * A variant is recognised by its name (a trailing 【…】 or ．境界 / ‧境界 / ・境界) or by a
 * `-peak` id whose base id exists (SP技能威力UP‧境界 belongs to SP技能威力提升).
 * Pure TS; works on anything with an id and a name.
 */

export interface NamedSkill {
  id: string
  name: string
}

const PEAK_SUFFIX = /[．‧・.]境界$/
const BRACKET_SUFFIX = /【[^】]*】$/

/** The family a skill belongs to, as the base skill's name. */
export function familyKey(skill: NamedSkill, nameById: Map<string, string>): string {
  if (skill.id.endsWith('-peak')) {
    const base = nameById.get(skill.id.slice(0, -'-peak'.length))
    if (base) return base
  }
  return skill.name.replace(PEAK_SUFFIX, '').replace(BRACKET_SUFFIX, '').trim()
}

/**
 * Split a list into families, in the order each family first appears. Members keep
 * their list order with the base skill (the one whose name is the key) first.
 * `catalogue` supplies the id → name lookup for `-peak` ids (defaults to the list).
 */
export function groupSkillFamilies<T extends NamedSkill>(skills: T[], catalogue: NamedSkill[] = skills): T[][] {
  const nameById = new Map(catalogue.map(s => [s.id, s.name]))
  const families = new Map<string, T[]>()
  for (const s of skills) {
    const key = familyKey(s, nameById)
    const list = families.get(key)
    if (list) list.push(s)
    else families.set(key, [s])
  }
  return [...families.entries()].map(([key, members]) => {
    const base = members.findIndex(m => m.name === key)
    if (base > 0) members.unshift(...members.splice(base, 1))
    return members
  })
}

/** The list reordered so every family sits together. */
export function orderBySkillFamily<T extends NamedSkill>(skills: T[], catalogue: NamedSkill[] = skills): T[] {
  return groupSkillFamilies(skills, catalogue).flat()
}

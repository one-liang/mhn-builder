/**
 * Driftstone pools as players think of them: every colour stone shares one common
 * pool, adds a handful of skills of its own, and prime stones each give one skill.
 * Pure TS over data/driftstone-skills.json.
 */

export interface StoneRecord {
  id: string
  name: string
  prime: boolean
  skillIds: string[]
}

export interface ColourStoneGroup {
  id: string
  name: string
  /** The colour word inside 漂流石【…】 */
  short: string
  /** Skills only this colour (among colour stones) can roll, in official order */
  exclusive: string[]
}

export interface DriftstoneGroups {
  colour: ColourStoneGroup[]
  /** Skills every colour stone can roll */
  shared: string[]
  /** One skill per prime stone, in official order */
  prime: { stoneId: string; name: string; skillId: string }[]
}

export const stoneShortName = (name: string) => name.replace(/^漂流(?:純)?石【(.+)】$/, '$1')

export function groupDriftstones(stones: StoneRecord[]): DriftstoneGroups {
  const colourStones = stones.filter(s => !s.prime)
  const shared = colourStones.length
    ? colourStones[0]!.skillIds.filter(id => colourStones.every(s => s.skillIds.includes(id)))
    : []
  const sharedSet = new Set(shared)
  return {
    colour: colourStones.map(s => ({
      id: s.id,
      name: s.name,
      short: stoneShortName(s.name),
      exclusive: s.skillIds.filter(id => !sharedSet.has(id)),
    })),
    shared,
    prime: stones
      .filter(s => s.prime && s.skillIds.length)
      .map(s => ({ stoneId: s.id, name: s.name, skillId: s.skillIds[0]! })),
  }
}

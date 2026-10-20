import { describe, expect, it } from 'vitest'
import { runAutoBuild } from '~/lib/autoBuildAlgorithm'
import type { Armor, Weapon } from '~/stores/equipment'

type Part = Armor['part']
const PARTS: Part[] = ['head', 'chest', 'arms', 'waist', 'legs']

function armor(id: string, part: Part, skills: [string, number][], driftstoneSlots = 0, defense = 100): Armor {
  return {
    id: `${id}-${part}`,
    name: `${id}-${part}`,
    nameEn: id,
    setName: id,
    setNameEn: id,
    part,
    defense,
    skills: skills.map(([skillId, level]) => ({ skillId, level })),
    driftstoneSlots,
    image: '',
  }
}

function weapon(id: string, skills: [string, number][], attack = 1000): Weapon {
  return {
    id,
    name: id,
    nameEn: id,
    type: 'long-sword',
    attack,
    element: null,
    affinity: 0,
    spSkill: null,
    skills: skills.map(([skillId, level]) => ({ skillId, level })),
    image: '',
  }
}

function emptyArmor(): Record<Part, Armor[]> {
  return { head: [], chest: [], arms: [], waist: [], legs: [] }
}

const skillMap = new Map([
  ['attack-boost', { id: 'attack-boost', maxLevel: 5, name: '攻擊' }],
  ['weakness-exploit', { id: 'weakness-exploit', maxLevel: 5, name: '弱點特效' }],
  ['guard', { id: 'guard', maxLevel: 5, name: '防禦' }],
])

describe('runAutoBuild', () => {
  it('picks the pieces that reach the target skill', () => {
    const all = emptyArmor()
    for (const p of PARTS) {
      all[p].push(armor('atk', p, [['attack-boost', 1]]))
      all[p].push(armor('def', p, [['guard', 1]], 0, 200))
    }
    const { builds } = runAutoBuild({ targetSkills: [{ skillId: 'attack-boost', desiredLevel: 5 }] }, all, skillMap)
    expect(builds[0]!.coveragePercent).toBe(100)
    for (const p of PARTS) expect(builds[0]!.armor[p]!.id).toBe(`atk-${p}`)
    expect(builds[0]!.unmetSkills).toEqual([])
  })

  it('keeps locked pieces as they are', () => {
    const all = emptyArmor()
    for (const p of PARTS) {
      all[p].push(armor('atk', p, [['attack-boost', 1]]))
      all[p].push(armor('def', p, [['guard', 1]]))
    }
    const locked = { head: all.head[1]! }
    const { builds } = runAutoBuild(
      { targetSkills: [{ skillId: 'attack-boost', desiredLevel: 5 }], lockedArmor: locked },
      all,
      skillMap,
    )
    expect(builds[0]!.armor.head!.id).toBe('def-head')
    expect(builds[0]!.unmetSkills).toEqual([{ skillId: 'attack-boost', name: '攻擊', missing: 1 }])
  })

  it('fills driftstone slots only when driftstones are included', () => {
    const all = emptyArmor()
    for (const p of PARTS) all[p].push(armor('slot', p, [], 1))
    const request = {
      targetSkills: [{ skillId: 'attack-boost', desiredLevel: 3 }],
      driftstoneSkillIds: new Set(['attack-boost']),
    }

    const off = runAutoBuild({ ...request, includeDriftstones: false }, all, skillMap)
    expect(off.builds[0]!.driftstoneAssignments).toBeUndefined()
    expect(off.builds[0]!.coveragePercent).toBe(0)

    const on = runAutoBuild({ ...request, includeDriftstones: true }, all, skillMap)
    const assigned = Object.values(on.builds[0]!.driftstoneAssignments!).flat().filter(Boolean)
    expect(assigned).toHaveLength(3)
    expect(on.builds[0]!.coveragePercent).toBe(100)
  })

  it('returns at most the requested number of builds, best first', () => {
    const all = emptyArmor()
    for (const p of PARTS) {
      all[p].push(armor('a', p, [['attack-boost', 1]]))
      all[p].push(armor('b', p, [['weakness-exploit', 1]]))
    }
    const { builds } = runAutoBuild(
      { targetSkills: [{ skillId: 'attack-boost', desiredLevel: 5 }], topK: 2 },
      all,
      skillMap,
    )
    expect(builds).toHaveLength(2)
    expect(builds.map(b => b.rank)).toEqual([1, 2])
    expect(builds[0]!.score).toBeGreaterThanOrEqual(builds[1]!.score)
  })

  it('picks the weapon whose skills close the gap', () => {
    const all = emptyArmor()
    for (const p of PARTS) all[p].push(armor('atk', p, [['attack-boost', 1]]))
    const weapons = [
      weapon('plain', [], 2000),
      weapon('we', [['weakness-exploit', 3]], 1500),
    ]
    const { builds } = runAutoBuild(
      { targetSkills: [{ skillId: 'attack-boost', desiredLevel: 5 }, { skillId: 'weakness-exploit', desiredLevel: 3 }], weapons },
      all,
      skillMap,
    )
    expect(builds[0]!.weapon!.id).toBe('we')
    expect(builds[0]!.coveragePercent).toBe(100)
  })

  it('breaks skill ties by attack', () => {
    const all = emptyArmor()
    for (const p of PARTS) all[p].push(armor('atk', p, [['attack-boost', 1]]))
    const weapons = [weapon('weak', [], 1000), weapon('strong', [], 2000)]
    const { builds } = runAutoBuild(
      { targetSkills: [{ skillId: 'attack-boost', desiredLevel: 5 }], weapons },
      all,
      skillMap,
    )
    expect(builds.map(b => b.weapon!.id)).toEqual(['strong', 'weak'])
  })

  it('keeps a locked weapon and leaves the weapon empty without a pool', () => {
    const all = emptyArmor()
    for (const p of PARTS) all[p].push(armor('atk', p, [['attack-boost', 1]]))
    const locked = weapon('locked', [])
    const withLock = runAutoBuild(
      { targetSkills: [{ skillId: 'attack-boost', desiredLevel: 5 }], lockedWeapon: locked, weapons: [weapon('other', [['attack-boost', 2]])] },
      all,
      skillMap,
    )
    expect(withLock.builds[0]!.weapon!.id).toBe('locked')

    const noPool = runAutoBuild({ targetSkills: [{ skillId: 'attack-boost', desiredLevel: 5 }] }, all, skillMap)
    expect(noPool.builds[0]!.weapon).toBeNull()
  })
})

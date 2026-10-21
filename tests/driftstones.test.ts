import { describe, expect, it } from 'vitest'
import { groupDriftstones, stoneShortName } from '~/lib/driftstones'
import driftstoneData from '../data/driftstone-skills.json'

describe('groupDriftstones', () => {
  it('splits a toy set into shared, exclusive and prime', () => {
    const groups = groupDriftstones([
      { id: 'red', name: '漂流石【紅】', prime: false, skillIds: ['fire', 'attack', 'guard'] },
      { id: 'blue', name: '漂流石【藍】', prime: false, skillIds: ['water', 'attack', 'guard'] },
      { id: 'attack-prime', name: '漂流純石【攻擊】', prime: true, skillIds: ['attack'] },
    ])
    expect(groups.shared).toEqual(['attack', 'guard'])
    expect(groups.colour.map(c => [c.short, c.exclusive])).toEqual([['紅', ['fire']], ['藍', ['water']]])
    expect(groups.prime).toEqual([{ stoneId: 'attack-prime', name: '漂流純石【攻擊】', skillId: 'attack' }])
  })

  it('matches the official pools: themed colours over one common pool', () => {
    const groups = groupDriftstones(driftstoneData.stones)
    expect(groups.colour.map(c => c.id)).toEqual(['red', 'blue', 'black', 'white', 'yellow', 'sky'])
    expect(groups.shared.length).toBeGreaterThan(10)
    const exclusive = (id: string) => groups.colour.find(c => c.id === id)!.exclusive
    expect(exclusive('red')).toContain('fire-attack')
    expect(exclusive('blue')).toContain('water-attack')
    expect(exclusive('yellow')).toContain('thunder-attack')
    expect(exclusive('sky')).toContain('ice-attack')
    expect(exclusive('black')).toContain('dragon-attack')
    // every achievable skill lands in at least one group
    const covered = new Set([...groups.shared, ...groups.colour.flatMap(c => c.exclusive), ...groups.prime.map(p => p.skillId)])
    for (const id of driftstoneData.achievableSkillIds) expect(covered.has(id)).toBe(true)
  })

  it('reads the colour word out of a stone name', () => {
    expect(stoneShortName('漂流石【水藍】')).toBe('水藍')
    expect(stoneShortName('漂流純石【攻擊】')).toBe('攻擊')
  })
})

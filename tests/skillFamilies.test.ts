import { describe, expect, it } from 'vitest'
import { familyKey, groupSkillFamilies, orderBySkillFamily } from '~/lib/skillFamilies'
import skills from '../data/skills.json'

const s = (id: string, name: string) => ({ id, name })

describe('familyKey', () => {
  const names = new Map([['special-boost', 'SP技能威力提升']])

  it('strips 境界 and 【…】 suffixes', () => {
    expect(familyKey(s('attack-boost-peak', '攻擊．境界'), new Map())).toBe('攻擊')
    expect(familyKey(s('follow-up-poison', '追擊【毒】'), new Map())).toBe('追擊')
    expect(familyKey(s('hi-fire', '高能強化【火】'), new Map())).toBe('高能強化')
  })

  it('follows -peak ids to a differently named base', () => {
    expect(familyKey(s('special-boost-peak', 'SP技能威力UP‧境界'), names)).toBe('SP技能威力提升')
  })
})

describe('groupSkillFamilies', () => {
  it('keeps families together in first-appearance order, base first', () => {
    const list = [
      s('attack-boost', '攻擊'),
      s('burst-peak', '連擊．境界'),
      s('critical-eye', '看破'),
      s('attack-boost-peak', '攻擊．境界'),
      s('burst', '連擊'),
    ]
    expect(groupSkillFamilies(list).map(f => f.map(x => x.name))).toEqual([
      ['攻擊', '攻擊．境界'],
      ['連擊', '連擊．境界'],
      ['看破'],
    ])
  })

  it('groups the real catalogue sensibly', () => {
    const ordered = orderBySkillFamily(skills).map(x => x.name)
    const at = (n: string) => ordered.indexOf(n)
    expect(at('攻擊．境界')).toBe(at('攻擊') + 1)
    expect(at('連擊．境界')).toBe(at('連擊') + 1)
    expect(at('SP技能威力UP‧境界')).toBe(at('SP技能威力提升') + 1)
    expect(ordered).toHaveLength(skills.length)
  })
})

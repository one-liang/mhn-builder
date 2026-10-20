import { describe, expect, it } from 'vitest'
import { matchScore, monsterTerms, normalizeText, searchList } from '~/lib/search'

const silver = { name: '銀火龍', nameEn: 'Silver Rathalos', aliases: ['銀火'] }

describe('matchScore', () => {
  it('matches a monster nickname through the monster terms', () => {
    expect(matchScore('銀火', '流星劍', monsterTerms(silver))).toBe(1)
    expect(matchScore('silver', '流星劍', monsterTerms(silver))).toBe(1)
    expect(matchScore('金火', '流星劍', monsterTerms(silver))).toBe(0)
  })

  it('ranks the record name above other terms', () => {
    expect(matchScore('銀火龍', '銀火龍', [])).toBe(4)
    expect(matchScore('銀火', '銀火龍頭盔', [])).toBe(3)
    expect(matchScore('火龍', '銀火龍頭盔', [])).toBe(2)
  })

  it('needs every token somewhere and ignores case and width', () => {
    expect(matchScore('ＳＩＬＶＥＲ 劍', '流星劍', monsterTerms(silver))).toBeGreaterThan(0)
    expect(matchScore('silver 槍', '流星劍', monsterTerms(silver))).toBe(0)
    expect(normalizeText(' Silver  Rath ')).toBe('silverrath')
  })

  it('treats a blank query as no match', () => {
    expect(matchScore('   ', '銀火龍', [])).toBe(0)
  })
})

describe('searchList', () => {
  const list = [
    { name: '火龍頭盔', monster: null },
    { name: '流星劍', monster: silver },
    { name: '銀火龍頭盔', monster: silver },
  ]
  const terms = (x: typeof list[number]) => ({ primary: x.name, others: monsterTerms(x.monster) })

  it('keeps the list for an empty query', () => {
    expect(searchList(list, '', terms)).toBe(list)
  })

  it('puts name matches before monster-only matches', () => {
    expect(searchList(list, '銀火', terms).map(x => x.name)).toEqual(['銀火龍頭盔', '流星劍'])
  })
})

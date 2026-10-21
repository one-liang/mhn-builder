import { describe, expect, it } from 'vitest'
import { namePhrases } from '../app/lib/skillNames'

describe('namePhrases', () => {
  it('breaks before a bracketed qualifier', () => {
    expect(namePhrases('SP計量表加速【完美迴避】')).toEqual(['SP計量表加速', '【完美迴避】'])
  })

  it('breaks after the dot of a 境界 suffix', () => {
    expect(namePhrases('雷屬性攻擊強化．境界')).toEqual(['雷屬性攻擊強化．', '境界'])
  })

  it('leaves a plain name whole', () => {
    expect(namePhrases('攻擊')).toEqual(['攻擊'])
    expect(namePhrases('')).toEqual([])
  })
})

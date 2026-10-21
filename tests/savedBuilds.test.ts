import { describe, expect, it } from 'vitest'
import {
  SAVED_BUILDS_LIMIT,
  mergeImported,
  parseExportFile,
  parseStoredBuilds,
  staleParts,
  toExportFile,
  type SavedBuild,
} from '~/lib/savedBuilds'

const build = (id: string, updatedAt = 1, params: Record<string, string> = { h: 'rathalos-head' }): SavedBuild =>
  ({ id, name: id, createdAt: 1, updatedAt, params })

describe('parseStoredBuilds', () => {
  it('drops malformed records and unknown params', () => {
    const raw = JSON.stringify([
      { id: 'a', name: ' 火龍 ', params: { h: 'rathalos-head', evil: 'x' } },
      { id: 'b', name: 'empty', params: {} },
      'junk',
    ])
    const builds = parseStoredBuilds(raw)
    expect(builds).toHaveLength(1)
    expect(builds[0]!.name).toBe('火龍')
    expect(builds[0]!.params).toEqual({ h: 'rathalos-head' })
  })

  it('survives unreadable storage', () => {
    expect(parseStoredBuilds('{nope')).toEqual([])
    expect(parseStoredBuilds(null)).toEqual([])
  })
})

describe('export and import', () => {
  it('round-trips through the export file', () => {
    const text = JSON.stringify(toExportFile([build('a')]))
    expect(parseExportFile(text).map(b => b.id)).toEqual(['a'])
  })

  it('rejects files that are not backups', () => {
    expect(() => parseExportFile('not json')).toThrow('無法讀取')
    expect(() => parseExportFile('{"builds":[]}')).toThrow('不是最強獵人')
  })

  it('merges by id, newer wins, and stops at the limit', () => {
    const r = mergeImported([build('a', 5)], [build('a', 9), build('b')])
    expect(r).toMatchObject({ added: 1, updated: 1, skipped: 0 })
    expect(r.builds.find(b => b.id === 'a')!.updatedAt).toBe(9)

    const full = Array.from({ length: SAVED_BUILDS_LIMIT }, (_, i) => build(`x${i}`))
    expect(mergeImported(full, [build('new')])).toMatchObject({ added: 0, skipped: 1 })
  })
})

describe('staleParts', () => {
  const slots: Record<string, number> = { 'rathalos-head': 1 }
  const gear = {
    hasWeapon: (id: string) => id === 'iron_sword',
    armorSlots: (_part: string, id: string) => slots[id],
    isDriftstoneSkill: (id: string) => id === 'attack-boost',
  }

  it('is empty when everything still exists', () => {
    expect(staleParts({ w: 'iron_sword', h: 'rathalos-head', dh: 'attack-boost' }, gear)).toEqual([])
  })

  it('names missing pieces and driftstones that would be dropped', () => {
    expect(staleParts({ w: 'gone', c: 'gone-chest' }, gear)).toEqual(['武器', '胸部'])
    expect(staleParts({ h: 'rathalos-head', dh: 'attack-boost,attack-boost' }, gear)).toEqual(['頭部漂流石'])
    expect(staleParts({ h: 'rathalos-head', dh: 'retired-skill' }, gear)).toEqual(['頭部漂流石'])
  })
})

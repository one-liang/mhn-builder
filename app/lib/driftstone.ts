import driftstoneData from '../../data/driftstone-skills.json'

/** 各色漂流石的代表色（用於篩選籤的色點） */
const STONE_SWATCHES: Record<string, string> = {
  red: '#D8432F',
  blue: '#2F6FD8',
  black: '#23272E',
  white: '#EEEFEA',
  yellow: '#E2B23A',
  sky: '#56BEE6',
}

/** 「漂流石【紅】」→「紅」 */
export function shortStoneName(name: string): string {
  return name.replace(/^漂流石【(.+)】$/, '$1')
}

export function stoneSwatch(id: string): string | undefined {
  return STONE_SWATCHES[id]
}

/** 篩選籤：全部 + 各色漂流石 + 純石 */
export const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...driftstoneData.stones
    .filter(s => !s.prime)
    .map(s => ({ id: s.id, name: shortStoneName(s.name), swatch: stoneSwatch(s.id) })),
  { id: 'prime', name: '純石' },
]

export const ACHIEVABLE_SKILL_IDS = new Set(driftstoneData.achievableSkillIds)

/** stoneId → 可鍊成的技能 ID */
export const STONE_SKILL_MAP = new Map<string, Set<string>>()
for (const stone of driftstoneData.stones) {
  if (!STONE_SKILL_MAP.has(stone.id)) {
    STONE_SKILL_MAP.set(stone.id, new Set(stone.skillIds))
  }
}

/** 擁有專屬純石的技能 */
export const PRIME_SKILL_IDS = new Set(
  driftstoneData.stones.filter(s => s.prime).flatMap(s => s.skillIds)
)

/** skillId → 可鍊成該技能的各色漂流石 */
export const SKILL_COLOR_STONES = new Map<string, { id: string; name: string; swatch?: string }[]>()
for (const stone of driftstoneData.stones) {
  if (stone.prime) continue
  for (const skillId of stone.skillIds) {
    if (!SKILL_COLOR_STONES.has(skillId)) SKILL_COLOR_STONES.set(skillId, [])
    SKILL_COLOR_STONES.get(skillId)!.push({ id: stone.id, name: shortStoneName(stone.name), swatch: stoneSwatch(stone.id) })
  }
}

/** 依石頭篩選 */
export function filterByStone<T extends { id: string }>(list: T[], stoneId: string): T[] {
  if (stoneId === 'all') return list
  if (stoneId === 'prime') return list.filter(s => PRIME_SKILL_IDS.has(s.id))
  const ids = STONE_SKILL_MAP.get(stoneId)
  return ids ? list.filter(s => ids.has(s.id)) : list
}

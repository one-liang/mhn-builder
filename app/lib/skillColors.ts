/**
 * Skill colours: one per category (the official site groups skills into five), with
 * per-skill overrides in data/skill-colors.json for colours picked from the game.
 * Used only for small marks (dots, level cells); text stays black and white.
 */
import skillColors from '../../data/skill-colors.json'

const CATEGORY: Record<string, string> = skillColors.categories
const OVERRIDES: Record<string, string> = skillColors.skills
const FALLBACK = CATEGORY.other ?? '#8B8D98'

export function skillColor(skill: { id: string; category?: string } | null | undefined): string {
  if (!skill) return FALLBACK
  return OVERRIDES[skill.id] ?? (skill.category && CATEGORY[skill.category]) ?? FALLBACK
}

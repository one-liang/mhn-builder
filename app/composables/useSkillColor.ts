import { useSkillStore } from '~/stores/skill'
import { skillColor } from '~/lib/skillColors'

/** Category colour for a skill id (for level pips and dots only). */
export function useSkillColor() {
  const skillStore = useSkillStore()
  return (skillId: string) => skillColor(skillStore.getById(skillId))
}

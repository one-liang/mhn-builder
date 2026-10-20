/**
 * Monster lookup for gear: names, search aliases and crest icons from data/monsters.json
 * (synced from the official site; `aliases` is hand-maintained there).
 */
import monsterData from '../../data/monsters.json'
import type { MonsterTerms } from './search'

export interface Monster extends MonsterTerms {
  id: string
  icon: string
}

const ARMOR_PARTS = ['head', 'chest', 'arms', 'waist', 'legs'] as const

export const MONSTERS: Monster[] = monsterData.monsters
const BY_ID = new Map(MONSTERS.map(m => [m.id, m]))
const ARMOR_SETS: Record<string, string> = monsterData.armorSets
const WEAPONS: Record<string, string> = monsterData.weapons

export function getMonster(id: string | null | undefined): Monster | null {
  return (id && BY_ID.get(id)) || null
}

export function monsterOfWeapon(weaponId: string): Monster | null {
  return getMonster(WEAPONS[weaponId])
}

/** Armor ids are "<set prefix>-<part>"; the set prefix carries the monster link. */
export function monsterOfArmor(armorId: string): Monster | null {
  const part = ARMOR_PARTS.find(p => armorId.endsWith(`-${p}`))
  const prefix = part ? armorId.slice(0, -(part.length + 1)) : armorId
  return getMonster(ARMOR_SETS[prefix])
}

/** Monsters in official order that own at least one of the given weapons. */
export function monstersOfWeapons(weaponIds: string[]): Monster[] {
  const ids = new Set(weaponIds.map(id => WEAPONS[id]).filter(Boolean))
  return MONSTERS.filter(m => ids.has(m.id))
}

/** Search terms a piece inherits from its monster (empty when it has none). */
export function monsterTermsOf(m: Monster | null): string[] {
  return m ? [m.name, m.nameEn, ...m.aliases] : []
}

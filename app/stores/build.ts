import { defineStore } from 'pinia'
import type { Armor, Weapon } from './equipment'
import { useEquipmentStore } from './equipment'
import { useSkillStore } from './skill'

export type ArmorSlot = 'head' | 'chest' | 'arms' | 'waist' | 'legs'
export type BuildSlot = 'weapon' | ArmorSlot

export interface BuildState {
  weapon: Weapon | null
  head: Armor | null
  chest: Armor | null
  arms: Armor | null
  waist: Armor | null
  legs: Armor | null
}

export interface SkillSummaryEntry {
  id: string
  name: string
  total: number
  max: number
  overflow: boolean
}

const STORAGE_KEY = 'mhn-builder-current-build'

const ARMOR_SLOTS: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']

const URL_PARAM_MAP: Record<BuildSlot, string> = {
  weapon: 'w',
  head: 'h',
  chest: 'c',
  arms: 'a',
  waist: 'wa',
  legs: 'l',
}

const DRIFTSTONE_PARAM_MAP: Record<ArmorSlot, string> = {
  head: 'dh',
  chest: 'dc',
  arms: 'da',
  waist: 'dw',
  legs: 'dl',
}

export const useBuildStore = defineStore('build', () => {
  const equipmentStore = useEquipmentStore()
  const skillStore = useSkillStore()

  const weapon = ref<Weapon | null>(null)
  const head = ref<Armor | null>(null)
  const chest = ref<Armor | null>(null)
  const arms = ref<Armor | null>(null)
  const waist = ref<Armor | null>(null)
  const legs = ref<Armor | null>(null)
  const hydrated = ref(false)

  // Per-armor driftstone skills: each slot holds an array of skill IDs (null = empty)
  const driftstoneSkills = reactive<Record<ArmorSlot, (string | null)[]>>({
    head: [],
    chest: [],
    arms: [],
    waist: [],
    legs: [],
  })

  const slots = { weapon, head, chest, arms, waist, legs }

  const skillSummary = computed<SkillSummaryEntry[]>(() => {
    const totals = new Map<string, number>()

    const addSkill = (skillId: string, level: number) => {
      const skill = skillStore.getById(skillId)
      const id = skill?.id ?? skillId
      totals.set(id, (totals.get(id) ?? 0) + level)
    }

    const armorPieces: (Armor | null)[] = [head.value, chest.value, arms.value, waist.value, legs.value]
    for (const piece of armorPieces) {
      if (!piece) continue
      for (const s of piece.skills) addSkill(s.skillId, s.level)
    }

    if (weapon.value) {
      for (const s of weapon.value.skills) addSkill(s.skillId, s.level)
    }

    // Driftstone skills contribute Lv1 each
    for (const slot of ARMOR_SLOTS) {
      for (const skillId of driftstoneSkills[slot]) {
        if (skillId) addSkill(skillId, 1)
      }
    }

    const entries: SkillSummaryEntry[] = []
    for (const [id, rawTotal] of totals) {
      const skill = skillStore.getById(id)
      const maxLevel = skill?.maxLevel ?? rawTotal
      entries.push({
        id,
        name: skill?.name ?? id,
        total: rawTotal,
        max: maxLevel,
        overflow: rawTotal > maxLevel,
      })
    }

    entries.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    return entries
  })

  const isEmpty = computed(() =>
    !weapon.value && !head.value && !chest.value && !arms.value && !waist.value && !legs.value
  )

  function setDriftstoneSkill(armorSlot: ArmorSlot, idx: number, skillId: string | null) {
    const arr = driftstoneSkills[armorSlot]
    while (arr.length <= idx) arr.push(null)
    arr[idx] = skillId
  }

  function clearDriftstoneSkills(armorSlot: ArmorSlot) {
    driftstoneSkills[armorSlot] = []
  }

  function setSlot(slot: BuildSlot, item: Weapon | Armor | null) {
    switch (slot) {
      case 'weapon': weapon.value = item as Weapon | null; break
      case 'head': head.value = item as Armor | null; if (!item) clearDriftstoneSkills('head'); break
      case 'chest': chest.value = item as Armor | null; if (!item) clearDriftstoneSkills('chest'); break
      case 'arms': arms.value = item as Armor | null; if (!item) clearDriftstoneSkills('arms'); break
      case 'waist': waist.value = item as Armor | null; if (!item) clearDriftstoneSkills('waist'); break
      case 'legs': legs.value = item as Armor | null; if (!item) clearDriftstoneSkills('legs'); break
    }
  }

  function clearSlot(slot: BuildSlot) {
    setSlot(slot, null)
  }

  function serialize(): Record<string, string> {
    const params: Record<string, string> = {}
    if (weapon.value) params[URL_PARAM_MAP.weapon] = weapon.value.id
    if (head.value) params[URL_PARAM_MAP.head] = head.value.id
    if (chest.value) params[URL_PARAM_MAP.chest] = chest.value.id
    if (arms.value) params[URL_PARAM_MAP.arms] = arms.value.id
    if (waist.value) params[URL_PARAM_MAP.waist] = waist.value.id
    if (legs.value) params[URL_PARAM_MAP.legs] = legs.value.id

    for (const slot of ARMOR_SLOTS) {
      const hasSkill = driftstoneSkills[slot].some(Boolean)
      if (hasSkill) {
        params[DRIFTSTONE_PARAM_MAP[slot]] = driftstoneSkills[slot].map(v => v ?? '').join(',')
      }
    }
    return params
  }

  function toShareUrl(origin: string, pathname = '/build'): string {
    const params = serialize()
    const search = new URLSearchParams(params).toString()
    return `${origin}${pathname}${search ? `?${search}` : ''}`
  }

  function findWeaponById(id: string): Weapon | null {
    for (const list of Object.values(equipmentStore.weapons)) {
      const found = list.find(w => w.id === id)
      if (found) return found
    }
    return null
  }

  function deserialize(params: Record<string, string | undefined>) {
    const weaponId = params[URL_PARAM_MAP.weapon]
    weapon.value = weaponId ? findWeaponById(weaponId) : null

    for (const slot of ARMOR_SLOTS) {
      const id = params[URL_PARAM_MAP[slot]]
      if (!id) {
        slots[slot].value = null
        clearDriftstoneSkills(slot)
        continue
      }
      const found = equipmentStore.getArmorByPart(slot).find(a => a.id === id) ?? null
      slots[slot].value = found

      const dParam = params[DRIFTSTONE_PARAM_MAP[slot]]
      if (dParam) {
        driftstoneSkills[slot] = dParam.split(',').map(v => v || null)
      } else {
        driftstoneSkills[slot] = []
      }
    }
  }

  function loadFromStorage(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const params = JSON.parse(raw) as Record<string, string>
      deserialize(params)
      return Object.keys(params).length > 0
    } catch {
      return false
    }
  }

  function saveToStorage() {
    if (typeof window === 'undefined') return
    const params = serialize()
    if (Object.keys(params).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
    }
  }

  function clearAll() {
    weapon.value = null
    head.value = null
    chest.value = null
    arms.value = null
    waist.value = null
    legs.value = null
    for (const slot of ARMOR_SLOTS) clearDriftstoneSkills(slot)
  }

  async function hydrate(queryParams?: Record<string, string | undefined>) {
    await Promise.all([
      equipmentStore.load(),
      skillStore.load(),
    ])

    const allParamKeys = [...Object.values(URL_PARAM_MAP), ...Object.values(DRIFTSTONE_PARAM_MAP)]
    const hasQuery = queryParams && allParamKeys.some(k => queryParams[k])
    if (hasQuery) {
      deserialize(queryParams!)
    } else {
      loadFromStorage()
    }

    if (typeof window !== 'undefined') {
      watch(
        [weapon, head, chest, arms, waist, legs, () => JSON.stringify(driftstoneSkills)],
        () => saveToStorage(),
        { deep: false }
      )
    }
    hydrated.value = true
  }

  return {
    weapon,
    head,
    chest,
    arms,
    waist,
    legs,
    hydrated,
    driftstoneSkills,
    skillSummary,
    isEmpty,
    setSlot,
    clearSlot,
    setDriftstoneSkill,
    clearDriftstoneSkills,
    serialize,
    deserialize,
    toShareUrl,
    loadFromStorage,
    saveToStorage,
    clearAll,
    hydrate,
  }
})

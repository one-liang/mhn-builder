import { defineStore } from 'pinia'

interface ArmorSkill {
  skillId: string
  level: number
}

interface ArmorMaterial {
  materialId: string
  quantity: number
}

export interface Armor {
  id: string
  name: string
  nameEn: string
  setName: string
  setNameEn: string
  part: 'head' | 'chest' | 'arms' | 'waist' | 'legs'
  defense: number
  skills: ArmorSkill[]
  driftstoneSlots: number
  image: string
}

interface WeaponElement {
  type: string
  value: number
}

export interface Weapon {
  id: string
  name: string
  nameEn: string
  type: string
  rarity: number
  attack: number
  element: WeaponElement | null
  affinity: number
  skills: ArmorSkill[]
  materials: ArmorMaterial[]
  image: string
}

type ArmorPart = 'head' | 'chest' | 'arms' | 'waist' | 'legs'

const WEAPON_TYPES = [
  'great-sword',
  'long-sword',
  'sword-and-shield',
  'hammer',
  'bow',
  'light-bowgun',
] as const

export const useEquipmentStore = defineStore('equipment', () => {
  const armor = ref<Record<ArmorPart, Armor[]>>({
    head: [],
    chest: [],
    arms: [],
    waist: [],
    legs: [],
  })

  const weapons = ref<Record<string, Weapon[]>>({})
  const loaded = ref(false)

  async function loadArmor() {
    const parts: ArmorPart[] = ['head', 'chest', 'arms', 'waist', 'legs']
    const results = await Promise.all(
      parts.map(part =>
        import(`../../data/armor/${part}.json`).then(m => ({ part, data: m.default as Armor[] }))
      )
    )
    for (const { part, data } of results) {
      armor.value[part] = data
    }
  }

  async function loadWeapons() {
    const results = await Promise.all(
      WEAPON_TYPES.map(type =>
        import(`../../data/weapons/${type}.json`)
          .then(m => ({ type, data: m.default as Weapon[] }))
          .catch(() => ({ type, data: [] as Weapon[] }))
      )
    )
    for (const { type, data } of results) {
      weapons.value[type] = data
    }
  }

  async function load() {
    if (loaded.value) return
    await Promise.all([loadArmor(), loadWeapons()])
    loaded.value = true
  }

  const allArmor = computed(() => {
    return Object.values(armor.value).flat()
  })

  function getArmorByPart(part: ArmorPart) {
    return armor.value[part] || []
  }

  function getArmorById(id: string) {
    return allArmor.value.find(a => a.id === id)
  }

  function getWeaponsByType(type: string) {
    return weapons.value[type] || []
  }

  function getWeaponById(type: string, id: string) {
    return getWeaponsByType(type).find(w => w.id === id)
  }

  const weaponTypes = computed(() => {
    return WEAPON_TYPES.map(type => ({
      type,
      name: getWeaponTypeName(type),
      nameEn: type,
      count: (weapons.value[type] || []).length,
    }))
  })

  return {
    armor,
    weapons,
    loaded,
    load,
    allArmor,
    getArmorByPart,
    getArmorById,
    getWeaponsByType,
    getWeaponById,
    weaponTypes,
  }
})

export function getWeaponTypeName(type: string): string {
  const names: Record<string, string> = {
    'great-sword': '大劍',
    'long-sword': '太刀',
    'sword-and-shield': '片手劍',
    'hammer': '錘',
    'bow': '弓',
    'light-bowgun': '輕弩',
  }
  return names[type] || type
}

export function getPartName(part: string): string {
  const names: Record<string, string> = {
    head: '頭部',
    chest: '胸部',
    arms: '腕部',
    waist: '腰部',
    legs: '腿部',
  }
  return names[part] || part
}

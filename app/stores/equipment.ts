import { defineStore } from 'pinia'

interface ArmorSkill {
  skillId: string
  level: number
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

export interface WeaponAmmo {
  name: string
  capacity: number
  recoil: string
  reload: string
}

export interface WeaponPhial {
  name: string
  description: string
}

export interface WeaponMelody {
  name: string
  description: string
}

export interface WeaponKinsect {
  name: string
  type: string
  performanceType: string
  attackSystem: string
  bonus: string
}

export interface Weapon {
  id: string
  name: string
  nameEn: string
  type: string
  attack: number
  element: WeaponElement | null
  affinity: number
  spSkill: string | null
  skills: ArmorSkill[]
  image: string
  ammo?: WeaponAmmo[]
  chargingShots?: string[]
  bottleType?: string | null
  phial?: WeaponPhial | null
  shellingType?: WeaponPhial | null
  melodies?: WeaponMelody[]
  kinsect?: WeaponKinsect | null
}

type ArmorPart = 'head' | 'chest' | 'arms' | 'waist' | 'legs'

const WEAPON_TYPES = [
  'great-sword',
  'long-sword',
  'sword-and-shield',
  'dual-blades',
  'hammer',
  'hunting-horn',
  'lance',
  'gunlance',
  'switch-axe',
  'charge-blade',
  'insect-glaive',
  'light-bowgun',
  'heavy-bowgun',
  'bow',
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
    'sword-and-shield': '單手劍',
    'dual-blades': '雙劍',
    'hammer': '大錘',
    'hunting-horn': '狩獵笛',
    'lance': '長槍',
    'gunlance': '銃槍',
    'switch-axe': '斬擊斧',
    'charge-blade': '充能斧',
    'insect-glaive': '操蟲棍',
    'light-bowgun': '輕弩槍',
    'heavy-bowgun': '重弩槍',
    'bow': '弓',
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

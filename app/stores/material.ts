import { defineStore } from 'pinia'

export interface Material {
  id: string
  name: string
  nameEn: string
  source: string
  rarity: number
}

export const useMaterialStore = defineStore('material', () => {
  const materials = ref<Material[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    const data = await import('../../data/materials.json')
    materials.value = data.default as Material[]
    loaded.value = true
  }

  function getById(id: string) {
    return materials.value.find(m => m.id === id)
  }

  function getName(id: string) {
    return getById(id)?.name || id
  }

  return { materials, loaded, load, getById, getName }
})

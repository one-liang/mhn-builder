import { defineStore } from 'pinia'

export interface Driftstone {
  id: string
  name: string
  nameEn: string
  possibleSkills: string[]
}

export const useDriftstoneStore = defineStore('driftstone', () => {
  const driftstones = ref<Driftstone[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    const data = await import('../../data/driftstones.json')
    driftstones.value = data.default as Driftstone[]
    loaded.value = true
  }

  function getById(id: string) {
    return driftstones.value.find(d => d.id === id)
  }

  function getBySkillId(skillId: string) {
    return driftstones.value.filter(d => d.possibleSkills.includes(skillId))
  }

  return { driftstones, loaded, load, getById, getBySkillId }
})

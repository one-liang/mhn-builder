import { defineStore } from 'pinia'

interface SkillLevel {
  level: number
  effect: string
}

export interface Skill {
  id: string
  name: string
  nameEn: string
  description: string
  maxLevel: number
  category: 'attack' | 'element' | 'defense' | 'resistance' | 'utility'
  levels: SkillLevel[]
}

export const useSkillStore = defineStore('skill', () => {
  const skills = ref<Skill[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    const data = await import('../../data/skills.json')
    skills.value = data.default as Skill[]
    loaded.value = true
  }

  function getById(id: string) {
    return skills.value.find(s => s.id === id)
  }

  function getByCategory(category: string) {
    if (!category || category === 'all') return skills.value
    return skills.value.filter(s => s.category === category)
  }

  function search(query: string) {
    const q = query.toLowerCase()
    return skills.value.filter(
      s => s.name.includes(q) || s.nameEn.toLowerCase().includes(q) || s.description.includes(q)
    )
  }

  const categories = computed(() => [
    { id: 'all', name: '全部' },
    { id: 'attack', name: '攻擊' },
    { id: 'element', name: '屬性' },
    { id: 'defense', name: '防禦' },
    { id: 'resistance', name: '耐性' },
    { id: 'utility', name: '輔助' },
  ])

  return { skills, loaded, load, getById, getByCategory, search, categories }
})

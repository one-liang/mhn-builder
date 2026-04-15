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

// Weapon data uses official website URL slugs which differ from skills.json IDs.
// This map resolves every known alias to the canonical skills.json ID.
const SKILL_ALIASES: Record<string, string> = {
  'abnormal-status-enhancement': 'status-sneak-attack',
  'airborne':                    'skyward-striker',
  'armor-up':                    'defense-ready',
  'attack-up-critical-down':     'brute-force',
  'ballistic':                   'ballistics',
  'bravery':                     'valor',
  'brutal-strike':               'maximum-might',
  'burst-secret':                'burst-peak',
  'concentration':               'sp-meter-boost',
  'disable-perfect-evade':       'resolute',
  'evasive-reload':              'dodge-load',
  'feat-of-agility':             'quick-work',
  'guarding-reload':             'load-guard',
  'high-performance-dragon':     'hi-dragon',
  'high-performance-ice':        'hi-ice',
  'last-stand':                  'last-stand-guard',
  'move-forward-strengthen':     'evasive-concentration',
  'multi-attack-boost':          'group-hunt-attack',
  'part-break-special-boost':    'special-partbreaker',
  'perfect-evade-attack-boost':  'aggressive-dodger',
  'perfect-evade-sp-charge':     'sp-meter-boost-dodge',
  'powerhouse':                  'attack-activation',
  'pursuit-poison':              'follow-up-poison',
  'rising-tide':                 'battle-temper',
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
    const normalizedId = id.replace(/_/g, '-')
    const resolvedId = SKILL_ALIASES[normalizedId] ?? normalizedId
    return skills.value.find(s => s.id === resolvedId)
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

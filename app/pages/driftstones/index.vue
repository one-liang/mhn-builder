<script setup lang="ts">
import { ChevronRight, Sparkle } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'
import driftstoneData from '../../../data/driftstone-skills.json'

useSeoMeta({
  title: '漂流石技能一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有可透過漂流石獲得的技能，依石頭顏色分類篩選。',
  ogTitle: '漂流石技能一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有漂流石可達技能，依石頭顏色分類。',
})

const skillStore = useSkillStore()
await skillStore.load()

const activeStone = ref('all')
const searchQuery = ref('')

const colourStones = driftstoneData.stones.filter(s => !s.prime)

const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...colourStones.map(s => ({ id: s.id, name: s.name.replace(/^漂流石【(.+)】$/, '$1') })),
  { id: 'prime', name: '純石' },
]

const ACHIEVABLE_IDS = new Set(driftstoneData.achievableSkillIds)

const STONE_SKILL_MAP = new Map<string, Set<string>>()
for (const stone of driftstoneData.stones) {
  if (!STONE_SKILL_MAP.has(stone.id)) {
    STONE_SKILL_MAP.set(stone.id, new Set(stone.skillIds))
  }
}

const primeSkillIds = new Set(
  driftstoneData.stones.filter(s => s.prime).flatMap(s => s.skillIds)
)

// skillId → colour stones that can roll it
const skillColourStones = new Map<string, { id: string; name: string }[]>()
for (const stone of colourStones) {
  for (const skillId of stone.skillIds) {
    if (!skillColourStones.has(skillId)) skillColourStones.set(skillId, [])
    skillColourStones.get(skillId)!.push({ id: stone.id, name: stone.name.replace(/^漂流石【(.+)】$/, '$1') })
  }
}

const filteredSkills = computed(() => {
  let list = skillStore.skills.filter(s => ACHIEVABLE_IDS.has(s.id))

  if (activeStone.value !== 'all') {
    if (activeStone.value === 'prime') {
      list = list.filter(s => primeSkillIds.has(s.id))
    } else {
      const stoneIds = STONE_SKILL_MAP.get(activeStone.value)
      if (stoneIds) list = list.filter(s => stoneIds.has(s.id))
    }
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q))

  return list
})
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-8">
    <PageHead title="漂流石">
      可鍊成 <span class="stamp text-[15px] font-bold text-ink">{{ ACHIEVABLE_IDS.size }}</span> 項技能，每個漂流石槽提供 Lv1
    </PageHead>

    <div class="sticky top-14 z-20 bg-ground border-b border-rule md:border-0">
      <div class="px-4 md:px-0 pb-1">
        <SearchField v-model="searchQuery" label="搜尋漂流石技能" placeholder="搜尋技能名稱" />
      </div>
      <FilterTabs v-model="activeStone" :items="STONE_FILTERS" label="漂流石種類" class="md:-mx-3">
        <template #icon="{ item }">
          <StoneSwatch v-if="item.id !== 'all'" :stone="item.id" />
        </template>
      </FilterTabs>
    </div>

    <ul class="bg-panel border-b md:border md:rounded-md md:mt-3 border-rule divide-y divide-rule">
      <li v-for="skill in filteredSkills" :key="skill.id">
        <NuxtLink
          :to="`/skills/${skill.id}`"
          class="grid grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-x-3 pl-4 pr-3 py-3 min-h-[64px] transition-colors duration-150 hover:bg-inset"
        >
          <span class="min-w-0">
            <span class="flex items-center gap-2">
              <span class="text-[16px] font-bold leading-snug">{{ skill.name }}</span>
              <span
                v-if="primeSkillIds.has(skill.id)"
                class="inline-flex items-center gap-1 h-5 px-1.5 rounded-xs border border-ink text-ink text-[11px] font-bold leading-none"
              >
                <Sparkle :size="11" :stroke-width="2.5" aria-hidden="true" />純石
              </span>
            </span>
            <span v-if="skillColourStones.get(skill.id)?.length" class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[12px] text-ink-2">
              <span v-for="stone in skillColourStones.get(skill.id)" :key="stone.id" class="inline-flex items-center gap-1.5">
                <StoneSwatch :stone="stone.id" />{{ stone.name }}
              </span>
            </span>
          </span>
          <span class="text-[12px] text-ink-2 whitespace-nowrap">最高 <span class="stamp text-[14px] font-bold text-ink">Lv{{ skill.maxLevel }}</span></span>
          <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>

    <p v-if="!filteredSkills.length" class="px-4 py-12 text-center text-[14px] text-ink-2">
      找不到符合的漂流石技能
    </p>
  </div>
</template>

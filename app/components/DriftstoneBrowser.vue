<script setup lang="ts">
import { ChevronRight, Sparkle } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'
import { searchList } from '~/lib/search'
import driftstoneData from '../../data/driftstone-skills.json'

// Skills a driftstone can roll, filtered by stone colour. Lives under the 技能 tab.
const skillStore = useSkillStore()
await skillStore.load()

const activeStone = ref('all')
const searchQuery = useQuerySearch()

const colourStones = driftstoneData.stones.filter(s => !s.prime)
const stoneName = (name: string) => name.replace(/^漂流石【(.+)】$/, '$1')

const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...colourStones.map(s => ({ id: s.id, name: stoneName(s.name) })),
  { id: 'prime', name: '純石' },
]

const ACHIEVABLE_IDS = new Set(driftstoneData.achievableSkillIds)
const STONE_SKILL_MAP = new Map(driftstoneData.stones.map(s => [s.id, new Set(s.skillIds)]))
const primeSkillIds = new Set(driftstoneData.stones.filter(s => s.prime).flatMap(s => s.skillIds))

// skillId → colour stones that can roll it
const skillColourStones = new Map<string, { id: string; name: string }[]>()
for (const stone of colourStones) {
  for (const skillId of stone.skillIds) {
    if (!skillColourStones.has(skillId)) skillColourStones.set(skillId, [])
    skillColourStones.get(skillId)!.push({ id: stone.id, name: stoneName(stone.name) })
  }
}

const filteredSkills = computed(() => {
  let list = skillStore.skills.filter(s => ACHIEVABLE_IDS.has(s.id))
  if (activeStone.value === 'prime') list = list.filter(s => primeSkillIds.has(s.id))
  else if (activeStone.value !== 'all') {
    const ids = STONE_SKILL_MAP.get(activeStone.value)
    if (ids) list = list.filter(s => ids.has(s.id))
  }
  return searchList(list, searchQuery.value, s => ({ primary: s.name, others: [s.nameEn] }))
})
</script>

<template>
  <div>
    <p class="px-4 md:px-0 pb-3 text-[14px] text-ink-2">
      可鍊成 <span class="stamp font-bold text-ink">{{ ACHIEVABLE_IDS.size }}</span> 項技能，每個漂流石槽提供 Lv1。
    </p>

    <div class="sticky top-14 md:top-16 z-20 bg-ground pb-3">
      <div class="px-4 md:px-0 pb-2">
        <SearchField v-model="searchQuery" label="搜尋漂流石技能" placeholder="搜尋技能名稱" />
      </div>
      <FilterTabs v-model="activeStone" :items="STONE_FILTERS" label="漂流石種類">
        <template #icon="{ item }">
          <StoneSwatch v-if="item.id !== 'all'" :stone="item.id" />
        </template>
      </FilterTabs>
    </div>

    <ul v-if="filteredSkills.length" class="card mx-4 md:mx-0 overflow-hidden divide-y divide-rule">
      <li v-for="skill in filteredSkills" :key="skill.id">
        <NuxtLink
          :to="`/skills/${skill.id}`"
          class="grid grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-x-3 px-4 py-3.5 min-h-[68px] hover:bg-inset"
        >
          <span class="min-w-0">
            <span class="flex items-center gap-2">
              <SkillDot :skill-id="skill.id" />
              <span class="text-[16px] font-bold leading-snug">{{ skill.name }}</span>
              <span
                v-if="primeSkillIds.has(skill.id)"
                class="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-shell text-shell-ink text-[11px] font-bold leading-none"
              >
                <Sparkle :size="11" :stroke-width="2.5" aria-hidden="true" />純石
              </span>
            </span>
            <span v-if="skillColourStones.get(skill.id)?.length" class="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 pl-[18px] text-[12px] text-ink-2">
              <span v-for="stone in skillColourStones.get(skill.id)" :key="stone.id" class="inline-flex items-center gap-1.5">
                <StoneSwatch :stone="stone.id" />{{ stone.name }}
              </span>
            </span>
          </span>
          <span class="text-[12px] text-ink-2 whitespace-nowrap">最高 <span class="stamp text-[15px] font-bold text-ink">Lv{{ skill.maxLevel }}</span></span>
          <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="mx-4 md:mx-0 px-4 py-12 card text-center text-[14px] text-ink-2">找不到符合的漂流石技能</p>
  </div>
</template>

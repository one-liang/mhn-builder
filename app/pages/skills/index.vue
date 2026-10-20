<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'
import { searchList } from '~/lib/search'

useSeoMeta({
  title: '技能與漂流石 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有技能與漂流石可鍊成的技能，包含攻擊、屬性、防禦、耐性、動作技能，支援分類篩選與搜尋。',
  ogTitle: '技能與漂流石 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有技能與漂流石技能，按分類篩選。',
})

const skillStore = useSkillStore()
await skillStore.load()

// 技能｜漂流石 share one tab; ?tab=driftstones opens the second (old /driftstones links land here)
const tab = useQuerySearch('tab')
const view = computed({
  get: () => (tab.value === 'driftstones' ? 'driftstones' : 'skills'),
  set: (v: string) => { tab.value = v === 'driftstones' ? 'driftstones' : '' },
})
const VIEWS = [
  { id: 'skills', name: '技能' },
  { id: 'driftstones', name: '漂流石' },
]

const activeCategory = ref('all')
const searchQuery = useQuerySearch()

const filteredSkills = computed(() =>
  searchList(skillStore.getByCategory(activeCategory.value), searchQuery.value, s => ({
    primary: s.name,
    others: [s.nameEn, s.description],
  }))
)
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-10">
    <PageHead title="技能">
      <template v-if="view === 'skills'">
        共 <span class="stamp font-bold text-ink">{{ skillStore.skills.length }}</span> 項<template v-if="filteredSkills.length !== skillStore.skills.length">，顯示 <span class="stamp font-bold text-ink">{{ filteredSkills.length }}</span> 項</template>
      </template>
      <template v-else>漂流石可鍊成的技能</template>
    </PageHead>

    <div class="px-4 md:px-0 pb-4">
      <SegmentedControl v-model="view" :items="VIEWS" label="技能或漂流石" />
    </div>

    <DriftstoneBrowser v-if="view === 'driftstones'" />

    <template v-else>
      <div class="sticky top-14 md:top-16 z-20 bg-ground pb-3">
        <div class="px-4 md:px-0 pb-2">
          <SearchField v-model="searchQuery" label="搜尋技能" placeholder="搜尋技能名稱或效果" />
        </div>
        <FilterTabs v-model="activeCategory" :items="skillStore.categories" label="技能分類" />
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
              </span>
              <span class="block pl-[18px] text-[13px] text-ink-2 leading-snug truncate">{{ skill.description }}</span>
            </span>
            <span class="text-[12px] text-ink-2 whitespace-nowrap">最高 <span class="stamp text-[15px] font-bold text-ink">Lv{{ skill.maxLevel }}</span></span>
            <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>

      <p v-else class="mx-4 md:mx-0 px-4 py-12 card text-center text-[14px] text-ink-2">找不到符合的技能</p>
    </template>
  </div>
</template>

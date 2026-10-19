<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'

useSeoMeta({
  title: '技能一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有技能資料，包含攻擊、屬性、防禦、耐性、輔助技能，支援分類篩選與搜尋。',
  ogTitle: '技能一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有技能資料，按分類篩選。',
})

const skillStore = useSkillStore()
await skillStore.load()

const activeCategory = ref('all')
const searchQuery = ref('')

const filteredSkills = computed(() => {
  let result = skillStore.getByCategory(activeCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      s => s.name.includes(q) || s.nameEn.toLowerCase().includes(q) || s.description.includes(q)
    )
  }
  return result
})
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-8">
    <PageHead title="技能">
      共 <span class="stamp text-[15px] font-bold text-ink">{{ skillStore.skills.length }}</span> 項，
      目前顯示 <span class="stamp text-[15px] font-bold text-ink">{{ filteredSkills.length }}</span> 項
    </PageHead>

    <div class="sticky top-14 z-20 bg-ground border-b border-rule md:border-0">
      <div class="px-4 md:px-0 pb-1">
        <SearchField v-model="searchQuery" label="搜尋技能" placeholder="搜尋技能名稱或效果" />
      </div>
      <FilterTabs v-model="activeCategory" :items="skillStore.categories" label="技能分類" class="md:-mx-3" />
    </div>

    <ul class="bg-panel border-b md:border md:rounded-md md:mt-3 border-rule divide-y divide-rule">
      <li v-for="skill in filteredSkills" :key="skill.id">
        <NuxtLink
          :to="`/skills/${skill.id}`"
          class="grid grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-x-3 pl-4 pr-3 py-3 min-h-[64px] transition-colors duration-150 hover:bg-inset"
        >
          <span class="min-w-0">
            <span class="block text-[16px] font-bold leading-snug">{{ skill.name }}</span>
            <span class="block text-[13px] text-ink-2 leading-snug truncate">{{ skill.description }}</span>
          </span>
          <span class="flex flex-col items-end gap-1">
            <TemperBar :total="0" :max="skill.maxLevel" size="sm" :label="`最高 Lv${skill.maxLevel}`" />
            <span class="text-[12px] text-ink-2">最高 <span class="stamp text-[14px] font-bold text-ink">Lv{{ skill.maxLevel }}</span></span>
          </span>
          <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>

    <p v-if="!filteredSkills.length" class="px-4 py-12 text-center text-[14px] text-ink-2">
      找不到符合的技能
    </p>
  </div>
</template>

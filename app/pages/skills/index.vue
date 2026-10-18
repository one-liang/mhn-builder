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

// 分類代表字（列表左側字牌）
const CATEGORY_GLYPH: Record<string, string> = {
  attack: '攻', element: '屬', defense: '防', resistance: '耐', utility: '動',
}

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
  <div class="mx-auto max-w-2xl px-4 sm:px-6">
    <PageHeader
      title="技能辭典"
      eyebrow="Skills"
      :count="filteredSkills.length"
      count-label="項"
    />

    <div class="mb-4 flex flex-col gap-2">
      <SearchField v-model="searchQuery" placeholder="搜尋技能名稱或效果" />
      <FilterChips v-model="activeCategory" :options="skillStore.categories" label="技能分類" />
    </div>

    <!-- Skill List -->
    <ul v-if="filteredSkills.length" class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      <li v-for="skill in filteredSkills" :key="skill.id">
        <NuxtLink
          :to="`/skills/${skill.id}`"
          class="group flex min-h-[44px] items-center gap-3 px-3 py-3 transition-colors hover:bg-secondary/70 sm:px-4"
        >
          <span
            class="flex size-9 flex-shrink-0 items-center justify-center rounded-sm bg-secondary font-display text-base font-black text-foreground"
            aria-hidden="true"
          >{{ CATEGORY_GLYPH[skill.category] ?? '技' }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <span class="truncate text-sm font-bold text-foreground">{{ skill.name }}</span>
              <span class="flex-shrink-0 font-num text-xs font-semibold tabular-nums text-muted-foreground">MAX {{ skill.maxLevel }}</span>
            </div>
            <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ skill.description }}</p>
          </div>
          <ChevronRight class="size-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="py-16 text-center text-sm text-muted-foreground">
      找不到符合條件的技能
    </p>
  </div>
</template>

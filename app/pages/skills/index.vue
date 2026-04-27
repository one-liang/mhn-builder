<script setup lang="ts">
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
  <div class="px-4 py-4 max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-foreground mb-4">技能一覽</h1>

    <!-- Search -->
    <div class="mb-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜尋技能名稱..."
        class="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 min-h-[44px]"
      />
    </div>

    <!-- Category Filter -->
    <div class="flex flex-nowrap gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-2 sm:pb-0 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      <button
        v-for="cat in skillStore.categories"
        :key="cat.id"
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px]"
        :class="activeCategory === cat.id
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-muted-foreground hover:text-foreground'"
        @click="activeCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Skill List -->
    <div class="flex flex-col gap-2">
      <NuxtLink
        v-for="skill in filteredSkills"
        :key="skill.id"
        :to="`/skills/${skill.id}`"
        class="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors min-h-[44px]"
      >
        <img src="/images/skills/skill.png" class="w-6 h-6 flex-shrink-0 rounded" :alt="skill.name" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-foreground">{{ skill.name }}</span>
            <span class="text-[10px] text-muted-foreground">Lv{{ skill.maxLevel }}</span>
          </div>
          <p class="text-xs text-muted-foreground truncate mt-0.5">{{ skill.description }}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground flex-shrink-0 ml-2"><path d="m9 18 6-6-6-6"/></svg>
      </NuxtLink>
    </div>

    <p v-if="!filteredSkills.length" class="text-center text-muted-foreground py-8">
      找不到符合條件的技能
    </p>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

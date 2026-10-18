<script setup lang="ts">
import { useSkillStore } from '~/stores/skill'
import { ACHIEVABLE_SKILL_IDS, PRIME_SKILL_IDS, SKILL_COLOR_STONES, STONE_FILTERS, filterByStone } from '~/lib/driftstone'

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

const filteredSkills = computed(() => {
  let list = filterByStone(
    skillStore.skills.filter(s => ACHIEVABLE_SKILL_IDS.has(s.id)),
    activeStone.value
  )

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s => s.name.toLowerCase().includes(q))
  }

  return list
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6">
    <PageHeader
      title="漂流石技能"
      eyebrow="Driftstones"
      :count="filteredSkills.length"
      count-label="項"
    >
      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        每個漂移鑲嵌槽可鍊成 1 項技能（固定 Lv1）。標示
        <span class="font-display font-black text-stone">純</span>
        者另有專屬純石。
      </p>
    </PageHeader>

    <div class="mb-4 flex flex-col gap-2">
      <SearchField v-model="searchQuery" placeholder="搜尋技能名稱" />
      <FilterChips v-model="activeStone" :options="STONE_FILTERS" label="漂流石種類" />
    </div>

    <!-- Skill list -->
    <ul v-if="filteredSkills.length" class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      <li
        v-for="skill in filteredSkills"
        :key="skill.id"
        class="flex items-start gap-3 px-3 py-3 sm:px-4"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-2">
            <span class="text-sm font-bold text-foreground">{{ skill.name }}</span>
            <span class="font-num text-xs font-semibold tabular-nums text-muted-foreground">MAX {{ skill.maxLevel }}</span>
          </div>

          <!-- Color stone tags -->
          <div
            v-if="SKILL_COLOR_STONES.get(skill.id)?.length"
            class="mt-2 flex flex-wrap gap-1"
          >
            <span
              v-for="stone in SKILL_COLOR_STONES.get(skill.id)"
              :key="stone.id"
              class="inline-flex h-6 items-center gap-1.5 rounded-sm border border-border bg-secondary px-1.5 text-[0.6875rem] text-secondary-foreground"
            >
              <span
                class="size-2 rounded-full ring-1 ring-inset ring-foreground/25"
                :style="{ background: stone.swatch }"
                aria-hidden="true"
              />
              {{ stone.name }}
            </span>
          </div>
        </div>

        <span
          v-if="PRIME_SKILL_IDS.has(skill.id)"
          class="flex size-7 flex-shrink-0 items-center justify-center rounded-sm border border-stone/50 bg-stone-soft font-display text-sm font-black text-stone"
          title="有專屬純石"
          aria-label="有專屬純石"
        >純</span>
      </li>
    </ul>

    <p v-else class="py-16 text-center text-sm text-muted-foreground">
      找不到符合條件的漂流石技能
    </p>
  </div>
</template>

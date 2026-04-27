<script setup lang="ts">
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

// Stone filter pills: 全部 + each color stone + 純石
const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...driftstoneData.stones
    .filter(s => !s.prime)
    .map(s => ({ id: s.id, name: s.name })),
  { id: 'prime', name: '純石' },
]

const ACHIEVABLE_IDS = new Set(driftstoneData.achievableSkillIds)

// Map: stoneId → Set<skillId>
const STONE_SKILL_MAP = new Map<string, Set<string>>()
for (const stone of driftstoneData.stones) {
  if (!STONE_SKILL_MAP.has(stone.id)) {
    STONE_SKILL_MAP.set(stone.id, new Set(stone.skillIds))
  }
}

// Set of skills that have a dedicated prime stone
const primeSkillIds = new Set(
  driftstoneData.stones.filter(s => s.prime).flatMap(s => s.skillIds)
)

// Reverse map: skillId → color stone names[]
const skillColorStones = new Map<string, string[]>()
for (const stone of driftstoneData.stones) {
  if (stone.prime) continue
  for (const skillId of stone.skillIds) {
    if (!skillColorStones.has(skillId)) skillColorStones.set(skillId, [])
    skillColorStones.get(skillId)!.push(stone.name)
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
  if (q) {
    list = list.filter(s => s.name.toLowerCase().includes(q))
  }

  return list
})
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-foreground mb-4">漂流石技能一覽</h1>

    <!-- Search -->
    <div class="mb-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜尋技能名稱..."
        class="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 min-h-[44px]"
      />
    </div>

    <!-- Stone filter pills -->
    <div class="flex flex-nowrap gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-2 sm:pb-0 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      <button
        v-for="stone in STONE_FILTERS"
        :key="stone.id"
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] border"
        :class="activeStone === stone.id
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'"
        @click="activeStone = stone.id"
      >
        {{ stone.name }}
      </button>
    </div>

    <!-- Skill list -->
    <div class="flex flex-col gap-2">
      <div
        v-for="skill in filteredSkills"
        :key="skill.id"
        class="p-3 rounded-lg bg-card border border-border"
      >
        <!-- Top row: name + badges -->
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-sm font-medium text-foreground">{{ skill.name }}</span>
              <span
                v-if="primeSkillIds.has(skill.id)"
                class="text-[9px] px-1 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 flex-shrink-0"
              >純石</span>
            </div>
            <div class="text-[11px] text-muted-foreground mt-0.5">
              最高 Lv{{ skill.maxLevel }}
            </div>
          </div>
        </div>

        <!-- Color stone tags -->
        <div
          v-if="skillColorStones.get(skill.id)?.length"
          class="flex flex-wrap gap-1 mt-2"
        >
          <span
            v-for="stoneName in skillColorStones.get(skill.id)"
            :key="stoneName"
            class="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground"
          >
            {{ stoneName }}
          </span>
        </div>
      </div>
    </div>

    <p v-if="!filteredSkills.length" class="text-center text-muted-foreground py-8">
      找不到符合條件的漂流石技能
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

<script setup lang="ts">
import { useDriftstoneStore } from '~/stores/driftstone'
import { useSkillStore } from '~/stores/skill'

useSeoMeta({
  title: '漂流石一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有漂流石（A～O）資料，查看每顆漂流石可能產出的技能。',
  ogTitle: '漂流石一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有漂流石與可能技能。',
})

const driftstoneStore = useDriftstoneStore()
const skillStore = useSkillStore()
await Promise.all([driftstoneStore.load(), skillStore.load()])

function resolveSkillName(skillId: string) {
  return skillStore.getById(skillId)?.name || skillId
}
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-foreground mb-4">漂流石一覽</h1>

    <div class="flex flex-col gap-2">
      <NuxtLink
        v-for="stone in driftstoneStore.driftstones"
        :key="stone.id"
        :to="`/driftstones/${stone.id}`"
        class="p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors min-h-[44px]"
      >
        <div class="flex items-center justify-between mb-2">
          <div>
            <h2 class="text-sm font-semibold text-foreground">{{ stone.name }}</h2>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground flex-shrink-0"><path d="m9 18 6-6-6-6"/></svg>
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="skillId in stone.possibleSkills"
            :key="skillId"
            class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary/80 border border-primary/15"
          >
            {{ resolveSkillName(skillId) }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <p v-if="!driftstoneStore.driftstones.length" class="text-center text-muted-foreground py-8">
      暫無資料
    </p>
  </div>
</template>

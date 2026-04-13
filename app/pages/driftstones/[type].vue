<script setup lang="ts">
import { useDriftstoneStore } from '~/stores/driftstone'
import { useSkillStore } from '~/stores/skill'

const route = useRoute()
const type = route.params.type as string

const driftstoneStore = useDriftstoneStore()
const skillStore = useSkillStore()
await Promise.all([driftstoneStore.load(), skillStore.load()])

const stone = computed(() => driftstoneStore.getById(type))

useSeoMeta({
  title: () => stone.value ? `${stone.value.name} | 最強獵人 - MHN 配裝模擬器` : '漂流石詳情 | 最強獵人',
  description: () => stone.value ? `${stone.value.name}可能產出的技能一覽。` : '',
  ogTitle: () => stone.value ? `${stone.value.name} | 最強獵人` : '',
  ogDescription: () => stone.value ? `查看${stone.value.name}可能產出的技能。` : '',
})
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <NuxtLink to="/driftstones" class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      返回漂流石列表
    </NuxtLink>

    <template v-if="stone">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-lg font-bold text-foreground">{{ stone.name }}</h1>
        <p class="text-xs text-muted-foreground mt-1">可能產出 {{ stone.possibleSkills.length }} 種技能</p>
      </div>

      <!-- Possible Skills -->
      <section class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">可能產出的技能</h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="skillId in stone.possibleSkills"
            :key="skillId"
            :to="`/skills/${skillId}`"
            class="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm text-foreground">{{ skillStore.getById(skillId)?.name || skillId }}</span>
              <p v-if="skillStore.getById(skillId)" class="text-xs text-muted-foreground truncate mt-0.5">
                {{ skillStore.getById(skillId)?.description }}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground flex-shrink-0 ml-2"><path d="m9 18 6-6-6-6"/></svg>
          </NuxtLink>
        </div>
      </section>
    </template>

    <div v-else class="text-center py-16 text-muted-foreground">找不到此漂流石</div>
  </div>
</template>

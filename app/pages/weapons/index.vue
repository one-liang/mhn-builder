<script setup lang="ts">
import { useEquipmentStore, getWeaponTypeName, getWeaponTypeIconName } from '~/stores/equipment'

useSeoMeta({
  title: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有武器類型，包含大劍、太刀、單手劍、雙劍、大錘、狩獵笛、長槍、銃槍、斬擊斧、充能斧、操蟲棍、輕弩槍、重弩槍、弓等 14 種武器資料。',
  ogTitle: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有武器類型與資料。',
})

const equipmentStore = useEquipmentStore()
await equipmentStore.load()
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-foreground mb-4">武器類型</h1>

    <div class="flex flex-col gap-2">
      <NuxtLink
        v-for="wt in equipmentStore.weaponTypes"
        :key="wt.type"
        :to="`/weapons/${wt.type}`"
        class="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors min-h-[44px]"
      >
        <div class="flex items-center gap-3">
          <img
            :src="`/images/weapon-types/${getWeaponTypeIconName(wt.type)}.svg`"
            class="w-6 h-6 flex-shrink-0 dark:invert"
            :alt="wt.name"
          />
          <div>
            <h2 class="text-sm font-semibold text-foreground">{{ wt.name }}</h2>
            <p class="text-xs text-muted-foreground">{{ wt.count }} 把武器</p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
      </NuxtLink>
    </div>
  </div>
</template>

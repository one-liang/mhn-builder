<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { useEquipmentStore } from '~/stores/equipment'

useSeoMeta({
  title: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有武器類型，包含大劍、太刀、單手劍、雙劍、大錘、狩獵笛、長槍、銃槍、斬擊斧、充能斧、操蟲棍、輕弩槍、重弩槍、弓等 14 種武器資料。',
  ogTitle: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有武器類型與資料。',
})

const equipmentStore = useEquipmentStore()
await equipmentStore.load()

const total = computed(() => equipmentStore.weaponTypes.reduce((n, wt) => n + wt.count, 0))
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-8">
    <PageHead title="武器">
      <span class="stamp text-[15px] font-bold text-ink">{{ equipmentStore.weaponTypes.length }}</span> 種武器，
      共 <span class="stamp text-[15px] font-bold text-ink">{{ total }}</span> 把
    </PageHead>

    <ul class="grid sm:grid-cols-2 bg-panel border-y md:border md:rounded-md border-rule divide-y divide-rule sm:divide-y-0 sm:gap-px sm:bg-rule overflow-hidden">
      <li v-for="wt in equipmentStore.weaponTypes" :key="wt.type" class="bg-panel">
        <NuxtLink
          :to="`/weapons/${wt.type}`"
          class="flex items-center gap-4 pl-4 pr-3 h-[68px] transition-colors duration-150 hover:bg-inset"
        >
          <span class="flex items-center justify-center size-11 rounded-md bg-shell text-shell-ink flex-shrink-0">
            <WeaponTypeIcon :type="wt.type" class="size-6" aria-hidden="true" />
          </span>
          <span class="flex-1 min-w-0 text-[17px] font-bold">{{ wt.name }}</span>
          <span class="stamp text-[22px] font-extrabold leading-none">{{ wt.count }}</span>
          <span class="text-[12px] text-ink-2 -ml-2">把</span>
          <ChevronRight :size="18" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

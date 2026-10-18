<script setup lang="ts">
import { useEquipmentStore, getWeaponTypeIconName } from '~/stores/equipment'

useSeoMeta({
  title: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有武器類型，包含大劍、太刀、單手劍、雙劍、大錘、狩獵笛、長槍、銃槍、斬擊斧、充能斧、操蟲棍、輕弩槍、重弩槍、弓等 14 種武器資料。',
  ogTitle: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有武器類型與資料。',
})

const equipmentStore = useEquipmentStore()
await equipmentStore.load()
const { imageUrl } = useImageUrl()

const totalWeapons = computed(() =>
  equipmentStore.weaponTypes.reduce((sum, wt) => sum + wt.count, 0)
)
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-5xl">
    <PageHeader
      title="武器圖鑑"
      eyebrow="Weapons"
      :count="totalWeapons"
      count-label="把武器"
    />

    <ul class="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-7">
      <li v-for="(wt, i) in equipmentStore.weaponTypes" :key="wt.type" class="bg-card">
        <NuxtLink
          :to="`/weapons/${wt.type}`"
          class="group relative flex h-full flex-col gap-5 p-4 transition-colors hover:bg-secondary/60"
        >
          <div class="flex items-start justify-between">
            <img
              :src="imageUrl(`/images/weapon-types/${getWeaponTypeIconName(wt.type)}.svg`)"
              class="size-9 opacity-80 transition-opacity group-hover:opacity-100 dark:invert"
              alt=""
            />
            <span class="font-num text-xs font-semibold tabular-nums text-muted-foreground">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
          </div>
          <div>
            <h2 class="text-[0.9375rem] font-bold text-foreground">{{ wt.name }}</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">
              <span class="font-num text-sm font-semibold tabular-nums text-foreground">{{ wt.count }}</span> 把
            </p>
          </div>
          <span
            class="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out-quart group-hover:scale-x-100"
            aria-hidden="true"
          />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

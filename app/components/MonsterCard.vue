<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { Monster } from '~/lib/monsters'

// The selected monster at the top of a filtered list, with a jump to its other gear.
defineProps<{
  monster: Monster
  /** e.g. "防具 5 件" */
  summary: string
  link?: { to: string; label: string }
}>()

const { imageUrl } = useImageUrl()
</script>

<template>
  <section class="card mx-4 md:mx-0 mb-3 flex items-center gap-4 p-4" :aria-label="`${monster.name}的裝備`">
    <img :src="imageUrl(monster.icon)" alt="" width="64" height="64" class="size-16 flex-shrink-0 rounded-[18px] bg-ground object-contain p-1" />
    <div class="flex-1 min-w-0">
      <h2 class="text-[22px] font-black leading-tight truncate" :title="monster.nameEn">{{ monster.name }}</h2>
      <p class="text-[14px] font-medium text-ink-2">{{ summary }}</p>
    </div>
    <NuxtLink v-if="link" :to="link.to" class="btn btn-secondary btn-sm flex-shrink-0 px-3.5">
      {{ link.label }}
      <ArrowRight :size="16" :stroke-width="2.25" aria-hidden="true" />
    </NuxtLink>
  </section>
</template>

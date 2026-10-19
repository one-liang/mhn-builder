<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

defineProps<{
  title: string
  backTo?: string
  backLabel?: string
}>()
</script>

<template>
  <header class="px-4 md:px-0 pt-4 pb-4">
    <NuxtLink
      v-if="backTo"
      :to="backTo"
      class="inline-flex items-center gap-1 h-11 -ml-1 pr-2 -mb-1 text-[13px] text-ink-2 hover:text-ink transition-colors duration-150"
    >
      <ArrowLeft :size="16" :stroke-width="2" aria-hidden="true" />
      {{ backLabel }}
    </NuxtLink>
    <div class="flex items-end justify-between gap-3" :class="backTo ? '' : 'pt-1'">
      <div class="min-w-0">
        <h1 class="text-[26px] leading-tight font-black tracking-[0.04em]">{{ title }}</h1>
        <p v-if="$slots.default" class="mt-1 text-[13px] text-ink-2">
          <slot />
        </p>
      </div>
      <slot name="aside" />
    </div>
  </header>
</template>

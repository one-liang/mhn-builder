<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

defineProps<{
  title: string
  backTo?: string
  backLabel?: string
}>()
</script>

<template>
  <header class="px-4 md:px-0 pt-5 md:pt-8 pb-5">
    <NuxtLink
      v-if="backTo"
      :to="backTo"
      class="inline-flex items-center gap-1.5 h-10 -ml-3 pl-3 pr-4 mb-2 rounded-full text-[14px] font-medium text-ink-2 hover:text-ink hover:bg-inset"
    >
      <ArrowLeft :size="16" :stroke-width="2.25" aria-hidden="true" />
      {{ backLabel }}
    </NuxtLink>
    <div class="flex items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-[34px] md:text-[44px] leading-[1.1] font-black tracking-[0.01em]">{{ title }}</h1>
        <p v-if="$slots.default" class="mt-2 text-[14px] text-ink-2">
          <slot />
        </p>
      </div>
      <slot name="aside" />
    </div>
  </header>
</template>

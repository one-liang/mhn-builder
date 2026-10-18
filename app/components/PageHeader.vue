<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'

defineProps<{
  title: string
  eyebrow?: string
  count?: number | string
  countLabel?: string
  back?: { to: string; label: string }
}>()
</script>

<template>
  <header class="pt-4 pb-5 sm:pt-6">
    <NuxtLink
      v-if="back"
      :to="back.to"
      class="group -ml-2 mb-2 inline-flex h-11 items-center gap-1 pl-1 pr-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft class="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
      {{ back.label }}
    </NuxtLink>
    <p v-if="eyebrow" class="eyebrow mb-2.5 text-primary">{{ eyebrow }}</p>
    <div class="flex items-end justify-between gap-4">
      <h1 class="min-w-0 font-display text-[1.75rem] font-black leading-[1.15] tracking-tight text-foreground sm:text-4xl">
        {{ title }}
      </h1>
      <p v-if="count !== undefined" class="flex-shrink-0 pb-1 text-xs text-muted-foreground">
        <span class="font-num text-xl font-semibold tabular-nums text-foreground">{{ count }}</span>
        {{ countLabel }}
      </p>
      <div v-if="$slots.actions" class="flex flex-shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </header>
</template>

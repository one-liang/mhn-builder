<script setup lang="ts">
defineProps<{
  title: string
  index?: string
  en?: string
}>()
</script>

<template>
  <div class="mb-3 flex items-center gap-2.5">
    <span v-if="index" class="font-num text-sm font-semibold tabular-nums text-primary">{{ index }}</span>
    <h2 class="text-[0.9375rem] font-bold text-foreground">{{ title }}</h2>
    <span v-if="en" class="eyebrow hidden text-muted-foreground sm:inline">{{ en }}</span>
    <span class="h-px flex-1 bg-border" aria-hidden="true" />
    <slot />
  </div>
</template>

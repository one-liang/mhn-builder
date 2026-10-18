<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  level: number
  size?: 'sm' | 'md'
}>(), { size: 'md' })
</script>

<template>
  <span
    class="inline-flex items-stretch overflow-hidden rounded-sm border border-border bg-secondary leading-none"
    :class="size === 'sm' ? 'h-[1.125rem] text-[0.625rem]' : 'h-5 text-[0.6875rem]'"
  >
    <span class="flex items-center px-1.5 font-medium text-secondary-foreground">{{ name }}</span>
    <span
      v-if="level > 0"
      class="flex items-center gap-px border-l border-border bg-card px-1.5 font-num font-semibold tabular-nums text-foreground"
      :class="size === 'sm' ? 'text-[0.6875rem]' : 'text-xs'"
    ><span class="text-[0.625rem] font-medium text-muted-foreground">Lv</span>{{ level }}</span>
  </span>
</template>

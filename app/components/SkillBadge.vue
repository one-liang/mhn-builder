<script setup lang="ts">
defineProps<{
  name: string
  level: number
  /** Custom enhancement level the weapon needs before this skill appears. */
  enhance?: number
}>()
</script>

<template>
  <span class="inline-flex items-baseline gap-1 whitespace-nowrap">
    <span>{{ name }}</span>
    <span class="stamp font-bold text-ink text-[14px] leading-none">Lv{{ level }}</span>
    <span v-if="enhance" class="text-[12px] text-ink-3">需強化 Lv{{ enhance }}</span>
  </span>
</template>

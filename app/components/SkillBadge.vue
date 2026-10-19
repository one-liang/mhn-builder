<script setup lang="ts">
defineProps<{
  name: string
  level: number
}>()
</script>

<template>
  <span class="inline-flex items-baseline gap-1 whitespace-nowrap">
    <span>{{ name }}</span>
    <span class="stamp font-bold text-ink text-[14px] leading-none">Lv{{ level }}</span>
  </span>
</template>

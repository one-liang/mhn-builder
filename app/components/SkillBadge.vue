<script setup lang="ts">
defineProps<{
  name: string
  level: number
}>()
</script>

<template>
  <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/15 text-primary border border-primary/20">
    {{ name }} Lv{{ level }}
  </span>
</template>

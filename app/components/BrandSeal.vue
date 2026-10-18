<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'lg' }>(), { size: 'sm' })
</script>

<template>
  <!-- 朱印：品牌標記 -->
  <span
    class="inline-flex flex-shrink-0 items-center justify-center bg-primary text-primary-foreground font-display font-black leading-none select-none"
    :class="size === 'lg' ? 'cut-corner size-16 text-4xl' : 'cut-corner-sm size-8 text-lg'"
    aria-hidden="true"
  >獵</span>
</template>

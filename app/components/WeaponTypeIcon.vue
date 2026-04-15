<script setup lang="ts">
defineProps<{
  type: string
}>()
defineOptions({ inheritAttrs: false })
</script>

<template>
  <!-- 大劍 -->
  <svg v-if="type === 'great-sword'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="m13 19 6-6" />
    <path d="m16 16 4 4" />
    <path d="m19 21 2-2" />
  </svg>
  <!-- 太刀 -->
  <svg v-else-if="type === 'long-sword'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 18.5 5.5" />
    <path d="M15 3h6v6" />
    <path d="m13 8 3 3" />
    <path d="M3 21h4" />
  </svg>
  <!-- 單手劍 -->
  <svg v-else-if="type === 'sword-and-shield'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="m13 19 6-6" />
    <path d="m16 16 4 4" />
    <path d="M19 5c0 3-2 5-4 5.5" />
    <path d="M15 2c2 0 4 1 4 3 0 .5-.1 1-.3 1.5" />
  </svg>
  <!-- 雙劍 -->
  <svg v-else-if="type === 'dual-blades'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 20 14 10" />
    <path d="M8 3h4v4" />
    <path d="m6 8 2 2" />
    <path d="M10 20 20 10" />
    <path d="M14 3h4v4" />
    <path d="m12 8 2 2" />
  </svg>
  <!-- 大錘 -->
  <svg v-else-if="type === 'hammer'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 12 3 22" />
    <path d="M8 7h12v6H8z" transform="rotate(-45 14 10)" />
  </svg>
  <!-- 狩獵笛 -->
  <svg v-else-if="type === 'hunting-horn'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 15 9" />
    <path d="M9 3h7v7" />
    <path d="m11 8 3 3" />
    <path d="M18 12c1.5 0 3 1.5 3 3s-1.5 3-3 3" />
    <path d="M18 18c0 1-1 2-2 2" />
  </svg>
  <!-- 長槍 -->
  <svg v-else-if="type === 'lance'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 19 5" />
    <path d="M17 3h4v4" />
    <path d="m15 7 2 2" />
    <path d="M3 21h3" />
    <path d="M5 19v3" />
  </svg>
  <!-- 銃槍 -->
  <svg v-else-if="type === 'gunlance'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 17 7" />
    <path d="M15 3h6v4h-6z" />
    <path d="m13 7 2 2" />
    <path d="M3 21h3" />
    <path d="M5 19v3" />
    <path d="M19 7v3" />
  </svg>
  <!-- 斬擊斧 -->
  <svg v-else-if="type === 'switch-axe'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 17 7" />
    <path d="M15 3c3 0 6 2 6 5s-2 4-5 4" />
    <path d="M13 9c0 2-1 3-3 4" />
  </svg>
  <!-- 充能斧 -->
  <svg v-else-if="type === 'charge-blade'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 15 9" />
    <path d="M13 3h5v5" />
    <path d="m11 7 3 3" />
    <path d="M17 5c1 1 2 3 0 5l-3-3" />
    <path d="M3 21h4" />
    <path d="M5 19v3" />
  </svg>
  <!-- 操蟲棍 -->
  <svg v-else-if="type === 'insect-glaive'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 19 5" />
    <path d="M17 3h4v4" />
    <circle cx="9" cy="7" r="2" />
    <path d="M9 5v2" />
    <path d="M7 7h4" />
  </svg>
  <!-- 輕弩槍 -->
  <svg v-else-if="type === 'light-bowgun'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12h10l3-3h4v6h-4l-3-3H4z" />
    <path d="M7 15v3" />
    <path d="M5 18h4" />
    <path d="M20 9V6" />
  </svg>
  <!-- 重弩槍 -->
  <svg v-else-if="type === 'heavy-bowgun'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12h12l3-4h4v8h-4l-3-4H2z" />
    <path d="M6 16v3" />
    <path d="M4 19h5" />
    <path d="M18 8V5" />
    <path d="M16 5h4" />
  </svg>
  <!-- 弓 -->
  <svg v-else-if="type === 'bow'" v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 3c0 9 5 14 14 14" />
    <path d="M5 3 19 17" />
    <path d="M3 5l2-2" />
    <path d="M19 17l2 2" />
    <path d="M10 10l3 3" />
  </svg>
  <!-- Fallback -->
  <svg v-else v-bind="$attrs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" x2="19" y1="19" y2="13" />
    <line x1="16" x2="20" y1="16" y2="20" />
    <line x1="19" x2="21" y1="21" y2="19" />
  </svg>
</template>

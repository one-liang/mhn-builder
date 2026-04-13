<script setup lang="ts">
defineProps<{
  type: string
}>()
</script>

<template>
  <svg v-if="type === 'great-sword'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="m13 19 6-6" />
    <path d="m16 16 4 4" />
    <path d="m19 21 2-2" />
  </svg>
  <svg v-else-if="type === 'long-sword'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21 18.5 5.5" />
    <path d="M15 3h6v6" />
    <path d="m13 8 3 3" />
    <path d="M3 21h4" />
  </svg>
  <svg v-else-if="type === 'sword-and-shield'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="m13 19 6-6" />
    <path d="m16 16 4 4" />
    <path d="M19 5c0 3-2 5-4 5.5" />
    <path d="M15 2c2 0 4 1 4 3 0 .5-.1 1-.3 1.5" />
  </svg>
  <svg v-else-if="type === 'hammer'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 12 3 22" />
    <path d="M8 7h12v6H8z" transform="rotate(-45 14 10)" />
  </svg>
  <svg v-else-if="type === 'bow'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 3c0 9 5 14 14 14" />
    <path d="M5 3 19 17" />
    <path d="M3 5l2-2" />
    <path d="M19 17l2 2" />
    <path d="M10 10l3 3" />
  </svg>
  <svg v-else-if="type === 'light-bowgun'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12h10l3-3h4v6h-4l-3-3H4z" />
    <path d="M7 15v3" />
    <path d="M5 18h4" />
    <path d="M20 9V6" />
  </svg>
  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" x2="19" y1="19" y2="13" />
    <line x1="16" x2="20" y1="16" y2="20" />
    <line x1="19" x2="21" y1="21" y2="19" />
  </svg>
</template>

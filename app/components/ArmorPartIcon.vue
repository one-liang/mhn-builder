<script setup lang="ts">
defineProps<{
  part: string
}>()
</script>

<template>
  <svg v-if="part === 'head'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 11a7 7 0 0 1 14 0v3a2 2 0 0 1-2 2h-1v2H8v-2H7a2 2 0 0 1-2-2z" />
    <path d="M8 11h8" />
    <path d="M9 14h6" />
  </svg>
  <svg v-else-if="part === 'chest'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 4h4l2 2 2-2h4l2 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
    <path d="M12 6v14" />
    <path d="M8 10h2" />
    <path d="M14 10h2" />
  </svg>
  <svg v-else-if="part === 'arms'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 4h10l-1 5-1 11H9L8 9z" />
    <path d="M8 9h8" />
    <path d="M9 14h6" />
  </svg>
  <svg v-else-if="part === 'waist'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 8h18v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="11.5" r="1.5" />
    <path d="M3 10h4" />
    <path d="M17 10h4" />
  </svg>
  <svg v-else-if="part === 'legs'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3h10l-1 8-1 10h-3l-1-8-1 8H7L6 11z" />
    <path d="M7 11h10" />
  </svg>
  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
</template>

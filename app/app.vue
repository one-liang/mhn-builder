<script setup lang="ts">
import { MotionConfig } from 'motion-v'
</script>

<template>
  <!-- Springs drop to instant changes when the system asks for reduced motion -->
  <MotionConfig reduced-motion="user">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </MotionConfig>
</template>

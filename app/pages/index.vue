<script setup lang="ts">
useSeoMeta({
  title: '最強獵人 - MHN 魔物獵人 Now 配裝模擬器 | 自動配裝・技能計算・漂流石搭配',
  description: '最強獵人是 Monster Hunter Now 最完整的繁體中文配裝模擬器，提供所有武器、防具、技能、漂流石資料查詢，支援自動配裝與技能計算。',
  ogTitle: '最強獵人 - MHN 魔物獵人 Now 配裝模擬器',
  ogDescription: '最完整的 MHN 繁體中文配裝模擬器，查詢所有裝備資料、自動配裝、技能計算。',
})

const quickLinks = [
  { name: '防具', description: '瀏覽所有防具資料', path: '/armor', icon: 'shield' },
  { name: '武器', description: '瀏覽所有武器資料', path: '/weapons', icon: 'sword' },
  { name: '技能', description: '查詢所有技能效果', path: '/skills', icon: 'zap' },
  { name: '漂流石', description: '漂流石技能一覽', path: '/driftstones', icon: 'gem' },
]
</script>

<template>
  <div class="px-4 py-6 max-w-lg mx-auto">
    <!-- Hero -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-black text-primary tracking-wider mb-2">最強獵人</h1>
      <p class="text-sm text-muted-foreground">MHN 魔物獵人 Now 配裝模擬器</p>
      <p class="text-xs text-muted-foreground mt-2">
        查詢所有裝備・技能・漂流石資料<br />
        打造你的最強配裝
      </p>
    </div>

    <!-- Quick Links -->
    <div class="grid grid-cols-2 gap-3">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.path"
        :to="link.path"
        class="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors min-h-[44px]"
      >
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <svg v-if="link.icon === 'shield'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
          <svg v-if="link.icon === 'sword'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/></svg>
          <svg v-if="link.icon === 'zap'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
          <svg v-if="link.icon === 'gem'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
        </div>
        <span class="text-sm font-semibold text-foreground">{{ link.name }}</span>
        <span class="text-[10px] text-muted-foreground text-center">{{ link.description }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

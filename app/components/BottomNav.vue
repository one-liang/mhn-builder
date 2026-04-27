<script setup lang="ts">
const route = useRoute()

const tabs = [
  { name: '配裝',   path: '/build',       icon: 'build',  iconImg: null },
  { name: '武器',   path: '/weapons',     icon: 'sword',  iconImg: '/images/weapon-types/weapon_great_sword.svg' },
  { name: '防具',   path: '/armor',       icon: 'shield', iconImg: null },
  { name: '技能',   path: '/skills',      icon: 'zap',    iconImg: '/images/skills/skill.png' },
  { name: '漂流石', path: '/driftstones', icon: 'gem',    iconImg: null },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom"
    aria-label="主要導航"
  >
    <div class="flex items-stretch justify-around max-w-lg mx-auto h-14">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors px-1 cursor-pointer"
        :class="isActive(tab.path) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
        :aria-current="isActive(tab.path) ? 'page' : undefined"
      >
        <!-- Active top border -->
        <span
          v-if="isActive(tab.path)"
          class="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-primary"
          aria-hidden="true"
        />

        <!-- Official image icon -->
        <img
          v-if="tab.iconImg"
          :src="tab.iconImg"
          width="20" height="20"
          class="rounded-sm"
          :class="[tab.iconImg.endsWith('.svg') ? 'dark:invert' : '', isActive(tab.path) ? 'opacity-100' : 'opacity-60']"
          :alt="tab.name"
        />
        <!-- Shield icon -->
        <svg v-if="!tab.iconImg && tab.icon === 'shield'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
        <!-- Build icon -->
        <svg v-if="!tab.iconImg && tab.icon === 'build'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="M19 5c0 3-2 5-4 5.5"/><path d="M15 2c2 0 4 1 4 3 0 .5-.1 1-.3 1.5"/></svg>
        <!-- Gem icon -->
        <svg v-if="!tab.iconImg && tab.icon === 'gem'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>

        <span class="text-[10px] mt-0.5 font-medium">{{ tab.name }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>

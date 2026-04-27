<script setup lang="ts">
const { isDark, toggle, init } = useTheme()
onMounted(() => init())
</script>

<template>
  <div class="flex flex-col min-h-dvh bg-background">
    <!-- Top Header -->
    <header class="sticky top-0 z-50 flex items-center h-12 px-4 border-b border-border bg-card/95 backdrop-blur-sm">
      <NuxtLink to="/" class="flex items-center gap-2 flex-1 min-w-0">
        <span
          class="text-lg font-bold text-primary tracking-wider truncate"
          style="font-family: var(--font-cinzel)"
        >最強獵人</span>
        <span class="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">MHN 配裝模擬器</span>
      </NuxtLink>

      <!-- Theme toggle -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-secondary hover:bg-muted transition-colors cursor-pointer"
        :aria-label="isDark ? '切換至明亮模式' : '切換至暗黑模式'"
        @click="toggle"
      >
        <!-- Sun icon (show in dark mode to switch to light) -->
        <svg
          v-if="isDark"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-primary"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <!-- Moon icon (show in light mode to switch to dark) -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-primary"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </header>

    <!-- Scrollable Content -->
    <main class="flex-1 pb-16">
      <slot />
    </main>

    <!-- Bottom Tab Navigation -->
    <BottomNav />
  </div>
</template>

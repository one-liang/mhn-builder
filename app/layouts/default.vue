<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { isDark, toggle, init } = useTheme()
onMounted(() => init())
</script>

<template>
  <div class="flex flex-col min-h-dvh bg-ground">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-shell focus:text-shell-ink focus:rounded-full"
    >跳到主要內容</a>

    <header class="sticky top-0 z-50 bg-ground border-b border-rule">
      <div class="flex items-center h-14 md:h-16 max-w-5xl mx-auto pl-4 pr-2 md:px-6 gap-3">
        <NuxtLink to="/build" class="mr-auto md:mr-6 text-[20px] leading-none font-black tracking-[0.02em]" aria-label="最強獵人 配裝">
          最強獵人
        </NuxtLink>

        <BottomNav variant="top" class="mr-auto" />

        <SiteSearch />

        <button
          type="button"
          class="flex items-center justify-center size-11 rounded-full text-ink hover:bg-inset"
          :aria-label="isDark ? '切換為亮色模式' : '切換為暗色模式'"
          :title="isDark ? '亮色模式' : '暗色模式'"
          @click="toggle"
        >
          <Sun v-if="isDark" :size="20" :stroke-width="2" aria-hidden="true" />
          <Moon v-else :size="20" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>
    </header>

    <main id="main" class="flex-1 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-0">
      <slot />
    </main>

    <BottomNav variant="bottom" />

    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { isDark, toggle, init } = useTheme()
onMounted(() => init())
</script>

<template>
  <div class="flex flex-col min-h-dvh bg-ground">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-3 focus:py-2 focus:bg-panel focus:text-ink focus:rounded-sm"
    >跳到主要內容</a>

    <header class="sticky top-0 z-50 bg-shell text-shell-ink border-b border-shell-rule">
      <div class="flex items-center h-14 max-w-6xl mx-auto pl-4 pr-2 md:px-6 gap-4">
        <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0 mr-auto md:mr-4" aria-label="最強獵人 首頁">
          <span class="text-[19px] leading-none font-black tracking-[0.08em]">最強獵人</span>
          <!-- maker's mark, as a smith stamps it into the tang -->
          <span
            class="stamp flex items-center h-[22px] px-1.5 border-[1.5px] border-shell-ink-2 rounded-[2px] text-[12px] leading-none font-bold uppercase tracking-[0.16em] text-shell-ink-2"
            aria-hidden="true"
          >MHN</span>
        </NuxtLink>

        <BottomNav variant="top" class="mr-auto" />

        <SiteSearch />

        <button
          type="button"
          class="flex items-center justify-center size-11 rounded-sm text-shell-ink-2 hover:text-shell-ink hover:bg-shell-raised transition-colors duration-200"
          :aria-label="isDark ? '切換為亮色模式' : '切換為暗色模式'"
          :title="isDark ? '亮色模式' : '暗色模式'"
          @click="toggle"
        >
          <Sun v-if="isDark" :size="20" :stroke-width="1.75" aria-hidden="true" />
          <Moon v-else :size="20" :stroke-width="1.75" aria-hidden="true" />
        </button>
      </div>
    </header>

    <main id="main" class="flex-1 pb-[calc(60px+env(safe-area-inset-bottom,0px))] md:pb-0">
      <slot />
    </main>

    <BottomNav variant="bottom" />
  </div>
</template>

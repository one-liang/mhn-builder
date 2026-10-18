<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { toggle, init } = useTheme()
const { sections, isActive } = useSections()
onMounted(() => init())
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background">
    <!-- Top Header -->
    <header class="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5" aria-label="最強獵人首頁">
          <BrandSeal />
          <span class="flex flex-col leading-none">
            <span class="font-display text-[1.0625rem] font-black tracking-wider text-foreground">最強獵人</span>
            <span class="eyebrow mt-1 text-[0.625rem] text-muted-foreground">MHN Builder</span>
          </span>
        </NuxtLink>

        <!-- Desktop navigation -->
        <nav class="hidden h-full flex-1 items-stretch md:flex" aria-label="主要導航">
          <NuxtLink
            v-for="s in sections"
            :key="s.path"
            :to="s.path"
            class="relative flex items-center px-3.5 text-sm font-medium transition-colors"
            :class="isActive(s.path) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
            :aria-current="isActive(s.path) ? 'page' : undefined"
          >
            {{ s.name }}
            <span
              v-if="isActive(s.path)"
              class="absolute inset-x-3.5 -bottom-px h-0.5 bg-primary"
              aria-hidden="true"
            />
          </NuxtLink>
        </nav>

        <!-- Theme toggle -->
        <button
          type="button"
          class="ml-auto flex size-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="切換深色／淺色模式"
          @click="toggle"
        >
          <Sun class="hidden size-[18px] dark:block" aria-hidden="true" />
          <Moon class="size-[18px] dark:hidden" aria-hidden="true" />
        </button>
      </div>
    </header>

    <main class="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-16">
      <slot />
    </main>

    <!-- Bottom Tab Navigation (mobile) -->
    <BottomNav class="md:hidden" />
  </div>
</template>

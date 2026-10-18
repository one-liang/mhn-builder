<script setup lang="ts">
const { sections, isActive } = useSections()
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    aria-label="主要導航"
  >
    <div class="mx-auto flex h-16 max-w-lg items-stretch">
      <NuxtLink
        v-for="s in sections"
        :key="s.path"
        :to="s.path"
        class="relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
        :class="isActive(s.path) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
        :aria-current="isActive(s.path) ? 'page' : undefined"
      >
        <span
          v-if="isActive(s.path)"
          class="absolute inset-x-4 -top-px h-0.5 bg-primary"
          aria-hidden="true"
        />
        <component
          :is="s.icon"
          class="size-5 transition-colors"
          :class="isActive(s.path) ? 'text-primary' : ''"
          :stroke-width="isActive(s.path) ? 2.25 : 1.75"
          aria-hidden="true"
        />
        <span class="text-[0.6875rem] font-medium leading-none">{{ s.name }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

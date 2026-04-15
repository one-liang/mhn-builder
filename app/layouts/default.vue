<template>
  <div class="flex flex-col min-h-dvh bg-background">
    <!-- Top Header -->
    <header class="sticky top-0 z-50 flex items-center h-12 px-4 border-b border-border bg-card/95 backdrop-blur-sm">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="text-lg font-bold text-primary">最強獵人</span>
      </NuxtLink>
      <span class="ml-2 text-xs text-muted-foreground">MHN 配裝模擬器</span>
    </header>

    <!-- Scrollable Content -->
    <main class="flex-1 overflow-y-auto pb-16">
      <slot />
    </main>

    <!-- Bottom Tab Navigation -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

defineProps<{
  placeholder: string
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="relative flex items-center">
    <Search class="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden="true" />
    <input
      v-model="model"
      type="text"
      inputmode="search"
      enterkeyhint="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      class="h-11 w-full rounded-md border border-border bg-card pl-9 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-border-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-ring"
    />
    <button
      v-if="model"
      type="button"
      class="absolute right-0.5 flex size-10 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      aria-label="清除搜尋"
      @click="model = ''"
    >
      <X class="size-4" aria-hidden="true" />
    </button>
  </div>
</template>

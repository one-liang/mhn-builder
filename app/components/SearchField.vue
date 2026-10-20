<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

defineProps<{
  placeholder: string
  label: string
  autofocus?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="relative flex items-center">
    <span class="sr-only">{{ label }}</span>
    <Search :size="18" :stroke-width="2.25" class="absolute left-4 text-ink pointer-events-none" aria-hidden="true" />
    <input
      v-model="model"
      type="search"
      inputmode="search"
      enterkeyhint="search"
      autocomplete="off"
      :placeholder="placeholder"
      :data-autofocus="autofocus ? '' : undefined"
      class="w-full h-12 pl-11 pr-11 rounded-full bg-inset text-[16px] text-ink outline-none focus:ring-2 focus:ring-ink [&::-webkit-search-cancel-button]:hidden"
    />
    <button
      v-if="model"
      type="button"
      class="absolute right-1 flex items-center justify-center size-10 rounded-full text-ink-2 hover:text-ink"
      aria-label="清除搜尋"
      @click="model = ''"
    >
      <X :size="16" :stroke-width="2.25" aria-hidden="true" />
    </button>
  </label>
</template>

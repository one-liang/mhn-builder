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
    <Search :size="18" :stroke-width="2" class="absolute left-3 text-ink-3 pointer-events-none" aria-hidden="true" />
    <input
      v-model="model"
      type="search"
      inputmode="search"
      enterkeyhint="search"
      autocomplete="off"
      :placeholder="placeholder"
      :data-autofocus="autofocus ? '' : undefined"
      class="w-full h-11 pl-10 pr-10 rounded-sm bg-inset border border-rule text-[15px] text-ink outline-none transition-colors duration-200 focus:border-focus focus:bg-panel [&::-webkit-search-cancel-button]:hidden"
    />
    <button
      v-if="model"
      type="button"
      class="absolute right-0 flex items-center justify-center size-11 text-ink-3 hover:text-ink"
      aria-label="清除搜尋"
      @click="model = ''"
    >
      <X :size="16" :stroke-width="2" aria-hidden="true" />
    </button>
  </label>
</template>

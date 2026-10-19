<script setup lang="ts" generic="T extends { id: string; name: string }">
// A horizontal strip of filter tabs. Scrolls on phones, wraps on wide screens.
defineProps<{
  items: T[]
  label: string
  wrap?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    class="strip flex overflow-x-auto px-2"
    :class="wrap ? 'md:flex-wrap md:overflow-visible' : ''"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="relative flex-shrink-0 flex items-center gap-1.5 h-11 px-3 text-[14px] whitespace-nowrap transition-colors duration-200"
      :class="model === item.id ? 'text-ink font-bold' : 'text-ink-2 hover:text-ink'"
      :aria-pressed="model === item.id"
      @click="model = item.id"
    >
      <slot name="icon" :item="item" />
      {{ item.name }}
      <span
        class="absolute inset-x-2 bottom-0 h-[3px] transition-colors duration-200"
        :class="model === item.id ? 'bg-ink' : 'bg-transparent'"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string; name: string }">
// A row of filter chips. Scrolls sideways on phones, wraps on wide screens.
defineProps<{
  items: T[]
  label: string
  wrap?: boolean
  /** Inside a sheet: keep the side padding at every width. */
  inSheet?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    class="strip flex gap-2 overflow-x-auto"
    :class="[inSheet ? 'px-5' : 'px-4 md:px-0', wrap ? 'md:flex-wrap md:overflow-visible' : '']"
    role="group"
    :aria-label="label"
  >
    <template v-if="$slots.before">
      <slot name="before" />
      <span class="flex-shrink-0 w-px my-2 bg-rule" aria-hidden="true" />
    </template>
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="chip flex-shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] whitespace-nowrap"
      :class="model === item.id ? 'bg-shell text-shell-ink font-bold' : 'bg-inset text-ink font-medium hover:bg-rule'"
      :aria-pressed="model === item.id"
      @click="model = item.id"
    >
      <slot name="icon" :item="item" />
      {{ item.name }}
    </button>
  </div>
</template>

<style scoped>
.chip {
  transition: transform 160ms var(--ease-out-quint);
}
.chip:active {
  transform: scale(0.95);
}
</style>

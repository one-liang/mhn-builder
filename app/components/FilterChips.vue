<script setup lang="ts">
interface FilterOption {
  id: string
  name: string
  swatch?: string
}

withDefaults(defineProps<{
  options: readonly FilterOption[]
  label: string
  /** 手機橫向捲動、寬螢幕自動換行 */
  wrap?: boolean
}>(), { wrap: true })

const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="scrollbar-none -mx-4 flex flex-nowrap gap-1.5 overflow-x-auto px-4 py-1.5"
    :class="wrap ? 'sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0' : ''"
  >
    <button
      v-for="opt in options"
      :key="opt.id"
      type="button"
      role="radio"
      :aria-checked="model === opt.id"
      class="relative inline-flex h-8 flex-shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-sm border px-3 text-xs font-medium transition-colors duration-150 before:absolute before:inset-x-0 before:-inset-y-1.5"
      :class="model === opt.id
        ? 'border-foreground bg-foreground text-background'
        : 'border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground'"
      @click="model = opt.id"
    >
      <span
        v-if="opt.swatch"
        class="size-2.5 rounded-full ring-1 ring-inset ring-foreground/25"
        :style="{ background: opt.swatch }"
        aria-hidden="true"
      />
      <slot name="icon" :option="opt" :active="model === opt.id" />
      {{ opt.name }}
    </button>
  </div>
</template>

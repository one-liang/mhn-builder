<script setup lang="ts">
/**
 * A skill level as a row of pips: one pip per level, filled in the skill's
 * category colour (the only colour on the screen). Levels past the max spill
 * after a small stop as hatched grey.
 *
 * Pips that fill after a change pop in on a spring (transform and opacity only),
 * never on first paint. With `selectable`, the row becomes a segmented control
 * for choosing a target level.
 */
const props = withDefaults(defineProps<{
  total: number
  max: number
  /** Category colour of the skill (see app/lib/skillColors.ts). */
  color?: string
  size?: 'sm' | 'md'
  selectable?: boolean
  label?: string
  /** Pop every filled pip when this row first appears (a skill that just arrived). */
  heatOnMount?: boolean
}>(), {
  color: 'var(--ink)',
  size: 'md',
  selectable: false,
  label: '',
  heatOnMount: false,
})

const emit = defineEmits<{
  (e: 'select', level: number): void
}>()

const lit = computed(() => Math.min(props.total, props.max))
const overflow = computed(() => Math.max(0, props.total - props.max))

// Pips above `popFrom` pop in sequence after a change.
const popFrom = ref(props.heatOnMount ? 0 : Number.POSITIVE_INFINITY)
watch(() => props.total, (_now, before) => {
  popFrom.value = Math.min(before ?? 0, props.max)
})

function isPopping(i: number) {
  return i <= lit.value && i > popFrom.value
}

function pipStyle(i: number) {
  return {
    backgroundColor: i <= lit.value ? props.color : undefined,
    animationDelay: isPopping(i) ? `${(i - popFrom.value - 1) * 50}ms` : undefined,
  }
}

const pipBox = computed(() => props.size === 'sm' ? 'w-3 h-1.5' : 'w-[18px] h-2')
</script>

<template>
  <span
    v-if="!selectable"
    class="inline-flex items-center gap-1"
    role="img"
    :aria-label="label || `等級 ${total} / ${max}`"
  >
    <span
      v-for="i in max"
      :key="`${i}-${i <= lit}`"
      class="rounded-full"
      :class="[pipBox, i <= lit ? '' : 'bg-cell', isPopping(i) ? 'pip-pop' : '']"
      :style="pipStyle(i)"
    />
    <template v-if="overflow > 0">
      <span class="w-px h-3 mx-0.5 bg-ink" aria-hidden="true" />
      <span v-for="j in overflow" :key="`o-${j}`" class="rounded-full spent" :class="pipBox" />
    </template>
  </span>

  <div
    v-else
    class="grid gap-1.5"
    :style="{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }"
    role="radiogroup"
    :aria-label="label || '目標等級'"
  >
    <button
      v-for="i in max"
      :key="`${i}-${i <= lit}`"
      type="button"
      role="radio"
      :aria-checked="i === total"
      :aria-label="`Lv${i}`"
      class="level flex flex-col items-center justify-center gap-1.5 h-12 rounded-[14px]"
      :class="i === total ? 'bg-shell text-shell-ink' : 'bg-ground text-ink-2 hover:text-ink'"
      @click="emit('select', i)"
    >
      <span class="stamp text-[14px] leading-none" :class="i === total ? 'font-bold' : 'font-semibold'">{{ i }}</span>
      <span
        class="w-5 h-1.5 rounded-full"
        :class="[i <= lit ? '' : 'bg-cell', isPopping(i) ? 'pip-pop' : '']"
        :style="pipStyle(i)"
      />
    </button>
  </div>
</template>

<style scoped>
.pip-pop {
  animation: pip-in 420ms var(--ease-spring) both;
}
.level {
  transition: transform 160ms var(--ease-out-quint);
}
.level:active {
  transform: scale(0.94);
}
.spent {
  background: repeating-linear-gradient(135deg, var(--spent) 0 2px, transparent 2px 4px);
  box-shadow: inset 0 0 0 1px var(--spent);
}
</style>

<script setup lang="ts">
/**
 * A skill level drawn as tempered steel: one cell per level, coloured along the
 * oxide scale (straw → bronze → peacock → purple → blue) so the last cell of a
 * maxed skill is always blue. The max is a visible stop; levels past it spill
 * beyond the stop as spent, overheated grey.
 *
 * Cells re-heat (forge orange → resting oxide) only when the level actually
 * changes, never on first paint. With `selectable`, the bar becomes a full-width
 * segmented control for choosing a target level.
 */
const props = withDefaults(defineProps<{
  total: number
  max: number
  size?: 'sm' | 'md'
  selectable?: boolean
  label?: string
  /** Heat every lit cell when this bar first appears (a skill that just arrived). */
  heatOnMount?: boolean
}>(), {
  size: 'md',
  selectable: false,
  label: '',
  heatOnMount: false,
})

const emit = defineEmits<{
  (e: 'select', level: number): void
}>()

const STOPS = ['--t1', '--t2', '--t3', '--t4', '--t5']

function stopFor(i: number) {
  const idx = Math.min(STOPS.length, Math.max(1, Math.ceil((i / props.max) * STOPS.length)))
  return `var(${STOPS[idx - 1]})`
}

const lit = computed(() => Math.min(props.total, props.max))
const overflow = computed(() => Math.max(0, props.total - props.max))

// Cells above `heatFrom` heat in sequence after a change.
const heatFrom = ref(props.heatOnMount ? 0 : Number.POSITIVE_INFINITY)
watch(() => props.total, (_now, before) => {
  heatFrom.value = Math.min(before ?? 0, props.max)
})

function isHeating(i: number) {
  return i <= lit.value && i > heatFrom.value
}

function cellStyle(i: number) {
  const on = i <= lit.value
  return {
    '--cell-colour': stopFor(i),
    backgroundColor: on ? stopFor(i) : undefined,
    animationDelay: isHeating(i) ? `${(i - heatFrom.value - 1) * 45}ms` : undefined,
  }
}

const cellBox = computed(() => props.size === 'sm' ? 'w-3 h-2' : 'w-4 h-2.5')
</script>

<template>
  <span
    v-if="!selectable"
    class="inline-flex items-center gap-[3px]"
    role="img"
    :aria-label="label || `等級 ${total} / ${max}`"
  >
    <span
      v-for="i in max"
      :key="`${i}-${i <= lit}`"
      class="rounded-[1px]"
      :class="[cellBox, i <= lit ? '' : 'bg-cell border border-cell-edge', isHeating(i) ? 'temper-heat' : '']"
      :style="cellStyle(i)"
    />
    <!-- the max stop -->
    <span
      class="w-[2px] mx-[2px]"
      :class="[size === 'sm' ? 'h-3' : 'h-4', overflow > 0 ? 'bg-ink' : 'bg-rule-strong']"
      aria-hidden="true"
    />
    <span
      v-for="j in overflow"
      :key="`o-${j}`"
      class="rounded-[1px] spent"
      :class="cellBox"
    />
  </span>

  <div
    v-else
    class="grid gap-1"
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
      class="group flex flex-col items-stretch justify-center gap-1 h-11 px-1.5 rounded-sm border transition-colors duration-150"
      :class="i === total ? 'border-ink bg-panel' : 'border-rule bg-inset hover:border-ink-2'"
      @click="emit('select', i)"
    >
      <span
        class="stamp text-[13px] leading-none text-center"
        :class="i === total ? 'font-bold text-ink' : 'text-ink-2'"
      >{{ i }}</span>
      <span
        class="h-2 rounded-[1px]"
        :class="[i <= lit ? '' : 'bg-cell border border-cell-edge', isHeating(i) ? 'temper-heat' : '']"
        :style="cellStyle(i)"
      />
    </button>
  </div>
</template>

<style scoped>
.temper-heat {
  animation: temper 640ms var(--ease-out-quint) both;
}
.spent {
  background: repeating-linear-gradient(
    135deg,
    var(--spent) 0 2px,
    transparent 2px 4px
  );
  box-shadow: inset 0 0 0 1px var(--spent);
}
</style>

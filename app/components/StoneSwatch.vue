<script setup lang="ts">
// A small square of the stone's real colour. Prime stones are drawn as a hollow, set stone.
const props = defineProps<{
  stone: string
}>()

const STONE_CLASS: Record<string, string> = {
  red: 'bg-stone-red',
  blue: 'bg-stone-blue',
  black: 'bg-stone-black',
  white: 'bg-stone-white',
  yellow: 'bg-stone-yellow',
  sky: 'bg-stone-sky',
}

const isPrime = computed(() => props.stone === 'prime' || props.stone.endsWith('-prime'))
</script>

<template>
  <span
    v-if="isPrime"
    class="inline-flex items-center justify-center size-3 rotate-45 ring-[1.5px] ring-ink"
    aria-hidden="true"
  >
    <span class="size-1 bg-ink" />
  </span>
  <span
    v-else
    class="inline-block size-3 rotate-45 ring-1 ring-ink/30"
    :class="STONE_CLASS[stone] ?? 'bg-spent'"
    aria-hidden="true"
  />
</template>

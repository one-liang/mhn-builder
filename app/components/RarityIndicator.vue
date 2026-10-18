<script setup lang="ts">
const props = defineProps<{
  rarity: number
}>()

const rarityColor = computed(() => {
  const colors: Record<number, string> = {
    1: 'bg-rarity-1',
    2: 'bg-rarity-2',
    3: 'bg-rarity-3',
    4: 'bg-rarity-4',
    5: 'bg-rarity-5',
    6: 'bg-rarity-6',
    7: 'bg-rarity-7',
    8: 'bg-rarity-8',
    9: 'bg-rarity-9',
  }
  return colors[props.rarity] || 'bg-rarity-1'
})
</script>

<template>
  <span class="inline-flex flex-shrink-0 items-center gap-1" :aria-label="`稀有度 ${rarity}`">
    <span class="h-3 w-1 -skew-x-12" :class="rarityColor" aria-hidden="true" />
    <span class="font-num text-[0.6875rem] font-semibold tabular-nums text-muted-foreground" aria-hidden="true">R{{ rarity }}</span>
  </span>
</template>

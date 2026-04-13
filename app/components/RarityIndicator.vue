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
  <span class="flex items-center gap-0.5">
    <span
      v-for="i in Math.min(rarity, 9)"
      :key="i"
      class="w-1.5 h-1.5 rounded-full"
      :class="rarityColor"
    />
  </span>
</template>

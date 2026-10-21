<script setup lang="ts">
import { namePhrases } from '~/lib/skillNames'

// A long name wraps inside its row instead of running past it; the level stays glued to its last line.
defineProps<{
  name: string
  level: number
  /** Custom enhancement level the weapon needs before this skill appears. */
  enhance?: number
}>()
</script>

<template>
  <span class="min-w-0 wrap-phrase"><template v-for="(part, i) in namePhrases(name)" :key="i"><wbr v-if="i">{{ part }}</template><span class="whitespace-nowrap">&nbsp;<span class="stamp font-bold text-ink text-[14px] leading-none">Lv{{ level }}</span></span> <span v-if="enhance" class="whitespace-nowrap text-[12px] text-ink-3">需強化 Lv{{ enhance }}</span></span>
</template>

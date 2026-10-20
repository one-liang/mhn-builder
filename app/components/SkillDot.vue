<script setup lang="ts">
import { useSkillStore } from '~/stores/skill'
import { skillColor } from '~/lib/skillColors'

// The skill's category colour as a small round mark (the only colour on a row).
const props = defineProps<{
  skillId: string
  size?: number
}>()

const skillStore = useSkillStore()
const color = computed(() => skillColor(skillStore.getById(props.skillId)))
</script>

<template>
  <span
    class="inline-block flex-shrink-0 rounded-full"
    :style="{ backgroundColor: color, width: `${size ?? 10}px`, height: `${size ?? 10}px` }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts" generic="T extends { id: string; name: string }">
// Two or three mutually exclusive views on one screen (技能｜漂流石). The thumb slides on transform only.
const props = defineProps<{
  items: T[]
  label: string
}>()

const model = defineModel<string>({ required: true })
const index = computed(() => Math.max(0, props.items.findIndex(i => i.id === model.value)))
</script>

<template>
  <div class="relative grid p-1 rounded-full bg-inset" :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }" role="tablist" :aria-label="label">
    <span
      class="thumb absolute top-1 bottom-1 left-1 rounded-full bg-ground"
      :style="{ width: `calc((100% - 8px) / ${items.length})`, transform: `translateX(${index * 100}%)` }"
      style="box-shadow: 0 1px 3px rgb(0 0 0 / 0.12)"
      aria-hidden="true"
    />
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="model === item.id"
      class="relative h-10 rounded-full text-[15px]"
      :class="model === item.id ? 'font-bold text-ink' : 'font-medium text-ink-2'"
      @click="model = item.id"
    >{{ item.name }}</button>
  </div>
</template>

<style scoped>
.thumb {
  transition: transform 320ms var(--ease-spring);
}
</style>

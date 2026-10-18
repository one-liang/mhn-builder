<script setup lang="ts">
import { Check, Gem, X } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'
import { ACHIEVABLE_SKILL_IDS, PRIME_SKILL_IDS, STONE_FILTERS, filterByStone } from '~/lib/driftstone'

const props = defineProps<{
  open: boolean
  /** 目前此槽位已選的技能 */
  current?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select', skillId: string | null): void
}>()

const skillStore = useSkillStore()
const search = ref('')
const activeStone = ref('all')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = ''
      activeStone.value = 'all'
    }
  }
)

const filteredSkills = computed(() => {
  // Step 1: filter by stone
  let list = filterByStone(
    skillStore.skills.filter(s => ACHIEVABLE_SKILL_IDS.has(s.id)),
    activeStone.value
  )

  // Step 2: filter by search query
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) || (s.nameEn ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

function close() {
  emit('update:open', false)
}

function onSelect(skillId: string) {
  emit('select', skillId)
  close()
}

function onClear() {
  emit('select', null)
  close()
}
</script>

<template>
  <BottomSheet :open="open" title="漂流鍊成技能" eyebrow="Driftstone" @close="close">
    <template #toolbar>
      <SearchField v-model="search" placeholder="搜尋漂流技能名稱" />
      <FilterChips v-model="activeStone" :options="STONE_FILTERS" label="漂流石種類" :wrap="false" />
    </template>

    <div class="flex flex-col gap-3 p-3 sm:p-4">
      <div class="flex items-center justify-between px-1">
        <p class="text-xs text-muted-foreground">
          <span class="font-num text-sm font-semibold tabular-nums text-foreground">{{ filteredSkills.length }}</span> 項技能
          <span class="ml-2 inline-flex items-center gap-1"><span class="font-display font-black text-stone">純</span>＝有專屬純石</span>
        </p>
        <button
          v-if="current"
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          @click="onClear"
        >
          <X class="size-3.5" aria-hidden="true" />
          清除技能
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="skill in filteredSkills"
          :key="skill.id"
          type="button"
          class="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-left text-[0.8125rem] leading-snug transition-colors"
          :class="current === skill.id
            ? 'border-stone bg-stone-soft font-bold text-foreground'
            : 'border-border bg-card text-foreground hover:border-stone/60'"
          :aria-pressed="current === skill.id"
          @click="onSelect(skill.id)"
        >
          <Check v-if="current === skill.id" class="size-4 flex-shrink-0 text-stone" aria-hidden="true" />
          <Gem v-else class="size-4 flex-shrink-0 text-stone/70" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate">{{ skill.name }}</span>
          <span
            v-if="PRIME_SKILL_IDS.has(skill.id)"
            class="flex-shrink-0 font-display text-xs font-black text-stone"
            title="有專屬純石"
          >純</span>
        </button>
      </div>

      <p v-if="!filteredSkills.length" class="py-12 text-center text-sm text-muted-foreground">
        找不到符合條件的漂流技能
      </p>
    </div>
  </BottomSheet>
</template>

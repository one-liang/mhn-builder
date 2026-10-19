<script setup lang="ts">
import { Sparkle } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'
import driftstoneData from '../../data/driftstone-skills.json'

const props = defineProps<{
  open: boolean
  currentSkillId?: string | null
  slotLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select', skillId: string | null): void
}>()

const skillStore = useSkillStore()
const search = ref('')
const activeStone = ref('all')

// 全部 + each colour stone + 純石
const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...driftstoneData.stones
    .filter(s => !s.prime)
    .map(s => ({ id: s.id, name: s.name.replace(/^漂流石【(.+)】$/, '$1') })),
  { id: 'prime', name: '純石' },
]

const ACHIEVABLE_IDS = new Set(driftstoneData.achievableSkillIds)

const STONE_SKILL_MAP = new Map<string, Set<string>>()
for (const stone of driftstoneData.stones) {
  if (!STONE_SKILL_MAP.has(stone.id)) {
    STONE_SKILL_MAP.set(stone.id, new Set(stone.skillIds))
  }
}
const primeSkillIds = new Set(
  driftstoneData.stones.filter(s => s.prime).flatMap(s => s.skillIds)
)

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
  let list = skillStore.skills.filter(s => ACHIEVABLE_IDS.has(s.id))

  if (activeStone.value !== 'all') {
    if (activeStone.value === 'prime') {
      list = list.filter(s => primeSkillIds.has(s.id))
    } else {
      const stoneIds = STONE_SKILL_MAP.get(activeStone.value)
      if (stoneIds) list = list.filter(s => stoneIds.has(s.id))
    }
  }

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
  <SheetDialog
    :open="open"
    :title="slotLabel ? `${slotLabel}・漂流石技能` : '漂流石技能'"
    @update:open="emit('update:open', $event)"
  >
    <template #controls>
      <div class="px-4 pt-3 pb-1">
        <SearchField v-model="search" label="搜尋漂流石技能" placeholder="搜尋技能名稱" autofocus />
      </div>
      <FilterTabs v-model="activeStone" :items="STONE_FILTERS" label="漂流石種類">
        <template #icon="{ item }">
          <StoneSwatch v-if="item.id !== 'all'" :stone="item.id" />
        </template>
      </FilterTabs>
    </template>

    <p class="px-4 pt-3 text-[13px] text-ink-2">每個漂流石槽固定提供 Lv1。</p>

    <div class="grid grid-cols-2 gap-2 p-4">
      <button
        v-for="skill in filteredSkills"
        :key="skill.id"
        type="button"
        class="flex items-center justify-between gap-2 min-h-12 px-3 py-2 rounded-sm border text-left text-[14px] leading-snug transition-colors duration-150"
        :class="currentSkillId === skill.id
          ? 'bg-shell text-shell-ink border-shell font-bold'
          : 'bg-panel border-rule hover:border-ink-2'"
        :aria-pressed="currentSkillId === skill.id"
        @click="onSelect(skill.id)"
      >
        <span class="min-w-0">{{ skill.name }}</span>
        <Sparkle
          v-if="primeSkillIds.has(skill.id)"
          :size="14"
          :stroke-width="2"
          class="flex-shrink-0"
          :class="currentSkillId === skill.id ? '' : 'text-ink-2'"
          aria-label="有純石"
        />
      </button>
    </div>

    <p v-if="!filteredSkills.length" class="px-4 pb-12 text-center text-[14px] text-ink-2">
      找不到符合的漂流石技能
    </p>

    <template v-if="currentSkillId" #footer>
      <button
        type="button"
        class="w-full h-11 rounded-sm border border-rule-strong text-[14px] font-bold text-ink hover:bg-inset transition-colors duration-200"
        @click="onClear"
      >
        清空這個漂流石槽
      </button>
    </template>
  </SheetDialog>
</template>

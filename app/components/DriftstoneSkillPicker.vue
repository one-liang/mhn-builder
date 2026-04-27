<script setup lang="ts">
import { useSkillStore } from '~/stores/skill'
import driftstoneData from '../../data/driftstone-skills.json'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select', skillId: string | null): void
}>()

const skillStore = useSkillStore()
const search = ref('')
const activeStone = ref('all')

// Build stone filter list: 全部 + each unique color stone + 純石
const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...driftstoneData.stones
    .filter(s => !s.prime)
    .map(s => ({ id: s.id, name: s.name })),
  { id: 'prime', name: '純石' },
]

const ACHIEVABLE_IDS = new Set(driftstoneData.achievableSkillIds)

// For each stone id: Set of skill IDs it can provide
const STONE_SKILL_MAP = new Map<string, Set<string>>()
for (const stone of driftstoneData.stones) {
  if (!STONE_SKILL_MAP.has(stone.id)) {
    STONE_SKILL_MAP.set(stone.id, new Set(stone.skillIds))
  }
}
// Build "prime" pseudo-filter: all skills with a dedicated prime stone
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
  // Step 1: filter by stone
  let list = skillStore.skills.filter(s => ACHIEVABLE_IDS.has(s.id))

  if (activeStone.value !== 'all') {
    if (activeStone.value === 'prime') {
      list = list.filter(s => primeSkillIds.has(s.id))
    } else {
      const stoneIds = STONE_SKILL_MAP.get(activeStone.value)
      if (stoneIds) list = list.filter(s => stoneIds.has(s.id))
    }
  }

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

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

onMounted(() => { window.addEventListener('keydown', onKeydown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKeydown) })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

        <div
          class="relative flex flex-col w-full sm:max-w-lg sm:mx-4 h-[100dvh] sm:h-[80dvh] sm:rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 h-12 border-b border-border">
            <h2 class="text-sm font-semibold text-foreground">選擇漂流鍊成技能</h2>
            <button
              class="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="關閉"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Search + stone filter -->
          <div class="px-3 pt-3 pb-2 border-b border-border flex flex-col gap-2">
            <input
              v-model="search"
              type="text"
              placeholder="搜尋漂流技能名稱..."
              class="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 min-h-[44px]"
            />
            <!-- Stone color filter pills -->
            <div class="flex flex-nowrap gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-0.5 sm:pb-0 scrollbar-none">
              <button
                v-for="stone in STONE_FILTERS"
                :key="stone.id"
                class="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap"
                :class="activeStone === stone.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'"
                @click="activeStone = stone.id"
              >
                {{ stone.name }}
              </button>
            </div>
          </div>

          <!-- Pill grid -->
          <div class="flex-1 overflow-y-auto px-3 pt-2 pb-3">
            <!-- Clear option -->
            <button
              class="w-full py-2 mb-3 rounded-full border border-dashed border-border hover:border-primary/60 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              @click="onClear"
            >
              清除技能
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="skill in filteredSkills"
                :key="skill.id"
                tabindex="0"
                class="px-3 py-2.5 rounded-full border border-border bg-secondary text-sm font-medium text-foreground text-center hover:border-primary/60 hover:bg-primary/8 transition-colors cursor-pointer leading-snug"
                @click="onSelect(skill.id)"
                @keydown.enter="onSelect(skill.id)"
                @keydown.space.prevent="onSelect(skill.id)"
              >
                <span class="truncate block">
                  {{ skill.name }}<span v-if="primeSkillIds.has(skill.id)" class="text-primary ml-0.5 text-[10px]">✦</span>
                </span>
              </button>
            </div>

            <p v-if="!filteredSkills.length" class="text-center text-muted-foreground py-8 text-sm">
              找不到符合條件的漂流技能
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { useSkillStore } from '~/stores/skill'

const props = defineProps<{
  open: boolean
  excludeIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'selectMany', skillIds: string[]): void
  (e: 'deselectMany', skillIds: string[]): void
}>()

const skillStore = useSkillStore()
const search = ref('')
const pendingIds = ref<Set<string>>(new Set())
const toRemoveIds = ref<Set<string>>(new Set())
const collapsedCats = ref<Set<string>>(new Set())

const MAX_SKILLS = 6

const DISPLAY_CATEGORIES = [
  { id: 'attack', name: '攻擊' },
  { id: 'element', name: '屬性' },
  { id: 'utility', name: '動作' },
  { id: 'defense-resistance', name: '防禦・耐性' },
]

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = ''
      pendingIds.value = new Set()
      toRemoveIds.value = new Set()
      collapsedCats.value = new Set()
    }
  }
)

const searchResults = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return []
  return skillStore.skills.filter(s =>
    s.name.toLowerCase().includes(q) || (s.nameEn ?? '').toLowerCase().includes(q)
  )
})

const skillsPerCategory = computed(() =>
  Object.fromEntries(
    DISPLAY_CATEGORIES.map(cat => [cat.id, skillStore.getByCategory(cat.id)])
  )
)

const excludeSet = computed(() => new Set(props.excludeIds ?? []))

const totalSelected = computed(() =>
  excludeSet.value.size - toRemoveIds.value.size + pendingIds.value.size
)

const canAddMore = computed(() => totalSelected.value < MAX_SKILLS)

function isSelected(skillId: string): boolean {
  return (excludeSet.value.has(skillId) && !toRemoveIds.value.has(skillId)) ||
    pendingIds.value.has(skillId)
}

function pillClass(skillId: string): string {
  if (toRemoveIds.value.has(skillId))
    return 'bg-destructive/10 border-destructive/40 text-destructive line-through cursor-pointer'
  if (isSelected(skillId))
    return 'bg-primary/12 border-primary text-primary font-semibold cursor-pointer'
  if (!canAddMore.value && !excludeSet.value.has(skillId))
    return 'bg-card border-border text-foreground/40 cursor-not-allowed'
  return 'bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/8 cursor-pointer'
}

function confirmClose() {
  emit('selectMany', [...pendingIds.value])
  emit('deselectMany', [...toRemoveIds.value])
  emit('update:open', false)
}

function cancelClose() {
  pendingIds.value = new Set()
  toRemoveIds.value = new Set()
  emit('update:open', false)
}

function toggleSkill(skillId: string) {
  if (excludeSet.value.has(skillId)) {
    const next = new Set(toRemoveIds.value)
    if (next.has(skillId)) next.delete(skillId)
    else next.add(skillId)
    toRemoveIds.value = next
    return
  }
  if (pendingIds.value.has(skillId)) {
    const next = new Set(pendingIds.value)
    next.delete(skillId)
    pendingIds.value = next
  } else {
    if (!canAddMore.value) return
    pendingIds.value = new Set([...pendingIds.value, skillId])
  }
}

function toggleCategory(catId: string) {
  const next = new Set(collapsedCats.value)
  if (next.has(catId)) next.delete(catId)
  else next.add(catId)
  collapsedCats.value = next
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) cancelClose()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
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
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="cancelClose" />

        <div
          class="relative flex flex-col w-full sm:max-w-lg sm:mx-4 h-[100dvh] sm:h-[85dvh] sm:rounded-xl bg-card shadow-2xl overflow-hidden"
        >
          <!-- Header: centered "技能" title + dotted separator -->
          <div class="pt-5 pb-0 px-5 text-center">
            <h2 class="text-lg font-bold text-foreground tracking-wide">技能</h2>
            <div class="mt-3 border-t border-dashed border-border/70" />
          </div>

          <!-- Search bar -->
          <div class="px-4 pt-3 pb-2">
            <input
              v-model="search"
              type="text"
              placeholder="搜尋"
              class="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 min-h-[44px]"
            />
          </div>

          <!-- Skill content area -->
          <div class="flex-1 overflow-y-auto scrollbar-none">
            <!-- Search results: flat 3-col grid -->
            <div v-if="search.trim()" class="px-4 py-3">
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="skill in searchResults"
                  :key="skill.id"
                  class="px-2 py-3 rounded-2xl border text-sm text-center leading-snug transition-colors"
                  :class="pillClass(skill.id)"
                  @click="toggleSkill(skill.id)"
                  @keydown.enter="toggleSkill(skill.id)"
                  @keydown.space.prevent="toggleSkill(skill.id)"
                >
                  {{ skill.name }}
                </button>
              </div>
              <p v-if="!searchResults.length" class="text-center text-muted-foreground py-8 text-sm">
                找不到符合條件的技能
              </p>
            </div>

            <!-- Category sections -->
            <div v-else class="px-4">
              <div v-for="cat in DISPLAY_CATEGORIES" :key="cat.id" class="pt-4 pb-2">
                <!-- Category header row -->
                <button
                  class="w-full flex items-center justify-between cursor-pointer mb-2"
                  @click="toggleCategory(cat.id)"
                >
                  <span class="text-base font-bold text-foreground">{{ cat.name }}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-muted-foreground transition-transform duration-200"
                    :class="collapsedCats.has(cat.id) ? 'rotate-180' : ''"
                  ><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <!-- Dotted separator -->
                <div class="border-t border-dotted border-border/70 mb-3" />
                <!-- 3-col pill grid -->
                <div v-if="!collapsedCats.has(cat.id)" class="grid grid-cols-3 gap-2">
                  <button
                    v-for="skill in skillsPerCategory[cat.id]"
                    :key="skill.id"
                    class="px-2 py-3 rounded-2xl border text-sm text-center leading-snug transition-colors"
                    :class="pillClass(skill.id)"
                    @click="toggleSkill(skill.id)"
                    @keydown.enter="toggleSkill(skill.id)"
                    @keydown.space.prevent="toggleSkill(skill.id)"
                  >
                    {{ skill.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom action buttons -->
          <div class="flex gap-3 px-4 py-4 border-t border-border/50 bg-card">
            <button
              class="flex-[2] py-3 rounded-xl border border-border/80 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors min-h-[44px] cursor-pointer"
              @click="cancelClose"
            >取消</button>
            <button
              class="flex-[3] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all min-h-[44px] cursor-pointer"
              @click="confirmClose"
            >好</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

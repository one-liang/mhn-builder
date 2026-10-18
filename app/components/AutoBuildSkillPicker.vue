<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'
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
  { id: 'attack', name: '攻擊', en: 'Attack' },
  { id: 'element', name: '屬性', en: 'Element' },
  { id: 'utility', name: '動作', en: 'Utility' },
  { id: 'defense-resistance', name: '防禦・耐性', en: 'Defense' },
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

function isDisabled(skillId: string): boolean {
  return !isSelected(skillId) && !toRemoveIds.value.has(skillId) && !canAddMore.value && !excludeSet.value.has(skillId)
}

function tileClass(skillId: string): string {
  if (toRemoveIds.value.has(skillId))
    return 'border-dashed border-destructive/60 bg-transparent text-destructive line-through'
  if (isSelected(skillId))
    return 'border-primary bg-accent font-bold text-accent-foreground'
  if (isDisabled(skillId))
    return 'border-border bg-card text-foreground/35 cursor-not-allowed'
  return 'border-border bg-card text-foreground hover:border-border-strong'
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
</script>

<template>
  <BottomSheet :open="open" title="目標技能" eyebrow="Auto Build" @close="cancelClose">
    <template #header-actions>
      <span class="mr-1 font-num text-sm font-semibold tabular-nums" :class="canAddMore ? 'text-muted-foreground' : 'text-primary'">
        <span class="text-lg text-foreground">{{ totalSelected }}</span>/{{ MAX_SKILLS }}
      </span>
    </template>

    <template #toolbar>
      <SearchField v-model="search" placeholder="搜尋技能名稱" />
    </template>

    <!-- Search results: flat grid -->
    <div v-if="search.trim()" class="p-3 sm:p-4">
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="skill in searchResults"
          :key="skill.id"
          type="button"
          class="relative min-h-12 cursor-pointer rounded-md border px-2 py-2.5 text-center text-[0.8125rem] leading-snug transition-colors"
          :class="tileClass(skill.id)"
          :aria-pressed="isSelected(skill.id)"
          :aria-disabled="isDisabled(skill.id) || undefined"
          @click="toggleSkill(skill.id)"
        >
          <span
            v-if="isSelected(skill.id)"
            class="absolute -right-px -top-px flex size-4 items-center justify-center rounded-bl-sm rounded-tr-md bg-primary text-primary-foreground"
            aria-hidden="true"
          ><Check class="size-3" :stroke-width="3" /></span>
          {{ skill.name }}
        </button>
      </div>
      <p v-if="!searchResults.length" class="py-12 text-center text-sm text-muted-foreground">
        找不到符合條件的技能
      </p>
    </div>

    <!-- Category sections -->
    <div v-else class="px-3 pb-4 sm:px-4">
      <section v-for="cat in DISPLAY_CATEGORIES" :key="cat.id" class="pt-4">
        <button
          type="button"
          class="mb-3 flex w-full cursor-pointer items-center gap-2.5 text-left"
          :aria-expanded="!collapsedCats.has(cat.id)"
          @click="toggleCategory(cat.id)"
        >
          <span class="text-[0.9375rem] font-bold text-foreground">{{ cat.name }}</span>
          <span class="eyebrow text-muted-foreground">{{ cat.en }}</span>
          <span class="font-num text-xs tabular-nums text-muted-foreground">{{ skillsPerCategory[cat.id]?.length }}</span>
          <span class="h-px flex-1 bg-border" aria-hidden="true" />
          <ChevronDown
            class="size-4 text-muted-foreground transition-transform duration-200"
            :class="collapsedCats.has(cat.id) ? '-rotate-90' : ''"
            aria-hidden="true"
          />
        </button>
        <div v-if="!collapsedCats.has(cat.id)" class="grid grid-cols-3 gap-2">
          <button
            v-for="skill in skillsPerCategory[cat.id]"
            :key="skill.id"
            type="button"
            class="relative min-h-12 cursor-pointer rounded-md border px-2 py-2.5 text-center text-[0.8125rem] leading-snug transition-colors"
            :class="tileClass(skill.id)"
            :aria-pressed="isSelected(skill.id)"
            :aria-disabled="isDisabled(skill.id) || undefined"
            @click="toggleSkill(skill.id)"
          >
            <span
              v-if="isSelected(skill.id)"
              class="absolute -right-px -top-px flex size-4 items-center justify-center rounded-bl-sm rounded-tr-md bg-primary text-primary-foreground"
              aria-hidden="true"
            ><Check class="size-3" :stroke-width="3" /></span>
            {{ skill.name }}
          </button>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <button
          type="button"
          class="h-11 flex-[2] cursor-pointer rounded-md border border-border text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          @click="cancelClose"
        >取消</button>
        <button
          type="button"
          class="cut-corner-sm h-11 flex-[3] cursor-pointer bg-primary text-sm font-bold text-primary-foreground transition-[filter] hover:brightness-110"
          @click="confirmClose"
        >確定</button>
      </div>
    </template>
  </BottomSheet>
</template>

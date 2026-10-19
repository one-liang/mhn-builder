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

const hasChanges = computed(() => pendingIds.value.size > 0 || toRemoveIds.value.size > 0)

function isSelected(skillId: string): boolean {
  return (excludeSet.value.has(skillId) && !toRemoveIds.value.has(skillId)) ||
    pendingIds.value.has(skillId)
}

function isBlocked(skillId: string): boolean {
  return !isSelected(skillId) && !canAddMore.value && !excludeSet.value.has(skillId)
}

function chipClass(skillId: string): string {
  if (toRemoveIds.value.has(skillId))
    return 'bg-panel border-danger text-danger line-through'
  if (isSelected(skillId))
    return 'bg-shell border-shell text-shell-ink font-bold'
  if (isBlocked(skillId))
    return 'bg-panel border-rule text-ink-3 opacity-60'
  return 'bg-panel border-rule text-ink hover:border-ink-2'
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
  <SheetDialog
    :open="open"
    title="目標技能"
    @update:open="(v) => { if (!v) cancelClose() }"
  >
    <template #title-extra>
      <span class="stamp text-[18px] font-bold leading-none text-shell-ink" aria-live="polite">
        {{ totalSelected }}<span class="text-shell-ink-2">/{{ MAX_SKILLS }}</span>
        <span class="sr-only">已選技能數</span>
      </span>
    </template>

    <template #controls>
      <div class="px-4 py-3">
        <SearchField v-model="search" label="搜尋技能" placeholder="搜尋技能名稱" autofocus />
      </div>
    </template>

    <div v-if="search.trim()" class="p-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="skill in searchResults"
          :key="skill.id"
          type="button"
          class="flex items-center gap-1.5 min-h-12 px-3 py-2 rounded-sm border text-[14px] text-left leading-snug transition-colors duration-150"
          :class="chipClass(skill.id)"
          :aria-pressed="isSelected(skill.id)"
          :aria-disabled="isBlocked(skill.id) || undefined"
          @click="toggleSkill(skill.id)"
        >
          <Check v-if="isSelected(skill.id)" :size="14" :stroke-width="3" class="flex-shrink-0" aria-hidden="true" />
          {{ skill.name }}
        </button>
      </div>
      <p v-if="!searchResults.length" class="py-12 text-center text-[14px] text-ink-2">
        找不到符合的技能
      </p>
    </div>

    <div v-else class="pb-4">
      <section v-for="cat in DISPLAY_CATEGORIES" :key="cat.id" class="px-4 pt-5">
        <h3>
          <button
            type="button"
            class="w-full flex items-center justify-between h-10 border-b-2 border-ink text-[15px] font-bold"
            :aria-expanded="!collapsedCats.has(cat.id)"
            @click="toggleCategory(cat.id)"
          >
            {{ cat.name }}
            <ChevronDown
              :size="18"
              :stroke-width="2"
              class="text-ink-2 transition-transform duration-200"
              :class="collapsedCats.has(cat.id) ? '-rotate-90' : ''"
              aria-hidden="true"
            />
          </button>
        </h3>
        <div v-if="!collapsedCats.has(cat.id)" class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
          <button
            v-for="skill in skillsPerCategory[cat.id]"
            :key="skill.id"
            type="button"
            class="flex items-center gap-1.5 min-h-12 px-3 py-2 rounded-sm border text-[14px] text-left leading-snug transition-colors duration-150"
            :class="chipClass(skill.id)"
            :aria-pressed="isSelected(skill.id)"
            :aria-disabled="isBlocked(skill.id) || undefined"
            @click="toggleSkill(skill.id)"
          >
            <Check v-if="isSelected(skill.id)" :size="14" :stroke-width="3" class="flex-shrink-0" aria-hidden="true" />
            {{ skill.name }}
          </button>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <button
          type="button"
          class="flex-[2] h-12 rounded-sm border border-rule-strong text-[15px] font-bold text-ink hover:bg-inset transition-colors duration-200"
          @click="cancelClose"
        >取消</button>
        <button
          type="button"
          class="flex-[3] h-12 rounded-sm bg-shell text-shell-ink text-[15px] font-bold hover:bg-shell-raised transition-colors duration-200"
          @click="confirmClose"
        >{{ hasChanges ? '套用選擇' : '完成' }}</button>
      </div>
    </template>
  </SheetDialog>
</template>

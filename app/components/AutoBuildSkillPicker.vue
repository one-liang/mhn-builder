<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'
import { searchList } from '~/lib/search'
import { groupSkillFamilies } from '~/lib/skillFamilies'
import type { Skill } from '~/stores/skill'

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

const searchResults = computed(() =>
  search.value.trim()
    ? groupSkillFamilies(
        searchList(skillStore.skills, search.value, s => ({ primary: s.name, others: [s.nameEn] })),
        skillStore.skills,
      )
    : []
)

const displayCategory = (category: string) =>
  category === 'defense' || category === 'resistance' ? 'defense-resistance' : category

// Families are built over the whole catalogue and shown under their base skill's
// category, so 完美巧擊【狀態異常】 sits next to 完美巧擊 even though it is an element skill.
const familiesPerCategory = computed(() => {
  const byCat: Record<string, Skill[][]> = Object.fromEntries(DISPLAY_CATEGORIES.map(c => [c.id, []]))
  for (const family of groupSkillFamilies(skillStore.skills)) {
    byCat[displayCategory(family[0]!.category)]?.push(family)
  }
  return byCat
})

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
    return 'bg-panel text-danger line-through ring-2 ring-inset ring-danger'
  if (isSelected(skillId))
    return 'bg-shell text-shell-ink font-bold'
  if (isBlocked(skillId))
    return 'bg-panel text-ink-3 opacity-60'
  return 'bg-panel text-ink hover:bg-inset'
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
      <span class="stamp mr-2 text-[18px] font-bold leading-none" aria-live="polite">
        {{ totalSelected }}<span class="text-ink-2">/{{ MAX_SKILLS }}</span>
        <span class="sr-only">已選技能數</span>
      </span>
    </template>

    <template #controls>
      <div class="px-5 pb-3">
        <SearchField v-model="search" label="搜尋技能" placeholder="搜尋技能名稱" autofocus />
      </div>
    </template>

    <div v-if="search.trim()" class="p-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 grid-flow-row-dense">
          <!-- A skill and its variants (攻擊 / 攻擊．境界) share one rounded group -->
          <div
            v-for="family in searchResults"
            :key="family[0]!.id"
            :class="family.length > 1 ? 'col-span-full grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1.5 rounded-[18px] bg-inset' : 'contents'"
            :role="family.length > 1 ? 'group' : undefined"
            :aria-label="family.length > 1 ? `${family[0]!.name}系列` : undefined"
          >
              <button
                v-for="skill in family"
                :key="skill.id"
                type="button"
                class="pick flex items-center gap-1.5 min-h-12 px-4 py-2 rounded-[14px] text-[14px] text-left leading-snug"
                :class="chipClass(skill.id)"
                :aria-pressed="isSelected(skill.id)"
                :aria-disabled="isBlocked(skill.id) || undefined"
                @click="toggleSkill(skill.id)"
              >
                <Check v-if="isSelected(skill.id)" :size="14" :stroke-width="3" class="flex-shrink-0" aria-hidden="true" />
                {{ skill.name }}
              </button>
          </div>
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
            class="w-full flex items-center justify-between h-10 text-[18px] font-black"
            :aria-expanded="!collapsedCats.has(cat.id)"
            @click="toggleCategory(cat.id)"
          >
            {{ cat.name }}
            <ChevronDown
              :size="18"
              :stroke-width="2"
              class="text-ink-2 chevron"
              :class="collapsedCats.has(cat.id) ? '-rotate-90' : ''"
              aria-hidden="true"
            />
          </button>
        </h3>
        <template v-if="!collapsedCats.has(cat.id)">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 grid-flow-row-dense pt-3">
          <!-- A skill and its variants (攻擊 / 攻擊．境界) share one rounded group -->
          <div
            v-for="family in familiesPerCategory[cat.id]"
            :key="family[0]!.id"
            :class="family.length > 1 ? 'col-span-full grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1.5 rounded-[18px] bg-inset' : 'contents'"
            :role="family.length > 1 ? 'group' : undefined"
            :aria-label="family.length > 1 ? `${family[0]!.name}系列` : undefined"
          >
              <button
                v-for="skill in family"
                :key="skill.id"
                type="button"
                class="pick flex items-center gap-1.5 min-h-12 px-4 py-2 rounded-[14px] text-[14px] text-left leading-snug"
                :class="chipClass(skill.id)"
                :aria-pressed="isSelected(skill.id)"
                :aria-disabled="isBlocked(skill.id) || undefined"
                @click="toggleSkill(skill.id)"
              >
                <Check v-if="isSelected(skill.id)" :size="14" :stroke-width="3" class="flex-shrink-0" aria-hidden="true" />
                {{ skill.name }}
              </button>
          </div>
        </div>
        </template>
      </section>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <button
          type="button"
          class="btn btn-secondary flex-[2]"
          @click="cancelClose"
        >取消</button>
        <button
          type="button"
          class="btn btn-primary flex-[3]"
          @click="confirmClose"
        >{{ hasChanges ? '套用選擇' : '完成' }}</button>
      </div>
    </template>
  </SheetDialog>
</template>

<style scoped>
.pick {
  transition: transform 160ms var(--ease-out-quint);
}
.pick:active {
  transform: scale(0.95);
}
.chevron {
  transition: transform 260ms var(--ease-spring);
}
</style>

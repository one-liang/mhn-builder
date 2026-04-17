<script setup lang="ts">
import { useSkillStore } from '~/stores/skill'

const props = defineProps<{
  open: boolean
  excludeIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select', skillId: string): void
}>()

const skillStore = useSkillStore()
const search = ref('')
const activeCategory = ref('all')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = ''
      activeCategory.value = 'all'
    }
  }
)

const filteredSkills = computed(() => {
  const q = search.value.trim().toLowerCase()
  let list = skillStore.getByCategory(activeCategory.value)
  if (q) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) || (s.nameEn ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

const excludeSet = computed(() => new Set(props.excludeIds ?? []))

function close() {
  emit('update:open', false)
}

function onSelect(skillId: string) {
  if (excludeSet.value.has(skillId)) return
  emit('select', skillId)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
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
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

        <div
          class="relative flex flex-col w-full sm:max-w-lg sm:mx-4 h-[100dvh] sm:h-[80dvh] sm:rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 h-12 border-b border-border">
            <h2 class="text-sm font-semibold text-foreground">選擇目標技能</h2>
            <button
              class="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="關閉"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Search -->
          <div class="px-3 pt-3 pb-2 border-b border-border flex flex-col gap-2">
            <input
              v-model="search"
              type="text"
              placeholder="搜尋技能名稱..."
              class="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 min-h-[44px]"
            />
            <!-- Category pills -->
            <div class="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                v-for="cat in skillStore.categories"
                :key="cat.id"
                class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer"
                :class="activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'"
                @click="activeCategory = cat.id"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
            <div
              v-for="skill in filteredSkills"
              :key="skill.id"
              role="button"
              :tabindex="excludeSet.has(skill.id) ? -1 : 0"
              class="p-3 rounded-lg border transition-colors"
              :class="excludeSet.has(skill.id)
                ? 'bg-secondary/20 border-border opacity-35 cursor-not-allowed'
                : 'bg-secondary/40 border-border hover:border-primary/40 cursor-pointer'"
              @click="onSelect(skill.id)"
              @keydown.enter="onSelect(skill.id)"
              @keydown.space.prevent="onSelect(skill.id)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-secondary"
                  :class="excludeSet.has(skill.id) ? 'text-muted-foreground/40' : 'text-primary/80'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-foreground">
                    {{ skill.name }}
                    <span v-if="excludeSet.has(skill.id)" class="text-xs text-muted-foreground ml-1">（已選擇）</span>
                  </div>
                  <div class="text-[11px] text-muted-foreground mt-0.5">最高 Lv{{ skill.maxLevel }}</div>
                </div>
              </div>
            </div>

            <p v-if="!filteredSkills.length" class="text-center text-muted-foreground py-8 text-sm">
              找不到符合條件的技能
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

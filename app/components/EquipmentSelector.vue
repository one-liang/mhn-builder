<script setup lang="ts">
import type { Armor, Weapon } from '~/stores/equipment'
import { useEquipmentStore, getPartName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import type { BuildSlot } from '~/stores/build'

type SelectableItem = Weapon | Armor

const props = defineProps<{
  open: boolean
  slotType: BuildSlot | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select', item: Weapon | Armor | null): void
}>()

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()

const search = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) search.value = ''
  }
)

const slotLabel = computed(() => {
  if (!props.slotType) return ''
  if (props.slotType === 'weapon') return '武器'
  return `${getPartName(props.slotType)}防具`
})

const allWeapons = computed<Weapon[]>(() => {
  return Object.values(equipmentStore.weapons).flat()
})

const items = computed<SelectableItem[]>(() => {
  const slot = props.slotType
  if (!slot) return []
  if (slot === 'weapon') return allWeapons.value
  return equipmentStore.getArmorByPart(slot)
})

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((item) => {
    const name = item.name.toLowerCase()
    const nameEn = (item.nameEn || '').toLowerCase()
    return name.includes(q) || nameEn.includes(q)
  })
})

function itemSkills(item: SelectableItem): { id: string; name: string; level: number }[] {
  return item.skills.slice(0, 3).map((s) => ({
    id: s.skillId,
    name: skillStore.getById(s.skillId)?.name ?? s.skillId,
    level: s.level,
  }))
}

function close() {
  emit('update:open', false)
}

function onSelect(item: SelectableItem) {
  emit('select', item)
  close()
}

function onClear() {
  emit('select', null)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
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
            <h2 class="text-sm font-semibold text-foreground">選擇{{ slotLabel }}</h2>
            <button
              class="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="關閉"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Search -->
          <div class="p-3 border-b border-border">
            <input
              v-model="search"
              type="text"
              :placeholder="`搜尋${slotLabel}名稱...`"
              class="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 min-h-[44px]"
            />
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
            <!-- Clear option -->
            <button
              class="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-accent/60 transition-colors min-h-[44px] text-left"
              @click="onClear"
            >
              <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-secondary text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </div>
              <span class="text-sm text-muted-foreground">取消選擇</span>
            </button>

            <div
              v-for="item in filteredItems"
              :key="item.id"
              role="button"
              tabindex="0"
              class="p-3 rounded-lg bg-secondary/40 border border-border hover:border-primary/40 transition-colors cursor-pointer"
              @click="onSelect(item)"
              @keydown.enter="onSelect(item)"
              @keydown.space.prevent="onSelect(item)"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-secondary text-primary/80">
                  <WeaponTypeIcon v-if="slotType === 'weapon' && 'type' in item" :type="item.type" class="w-5 h-5" />
                  <ArmorPartIcon v-else-if="slotType && slotType !== 'weapon'" :part="slotType" class="w-5 h-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-foreground truncate">{{ item.name }}</div>
                  <div v-if="itemSkills(item).length" class="flex flex-wrap gap-1 mt-1.5">
                    <span
                      v-for="s in itemSkills(item)"
                      :key="s.id"
                      class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/15 text-primary border border-primary/20"
                    >
                      {{ s.name }}<template v-if="s.level > 0"> Lv{{ s.level }}</template>
                    </span>
                  </div>
                  <!-- Driftstone slot count indicator -->
                  <div
                    v-if="slotType !== 'weapon' && 'driftstoneSlots' in item && (item as Armor).driftstoneSlots > 0"
                    class="flex items-center gap-1 mt-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-primary/60"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
                    <span class="text-[10px] text-primary/70 font-medium">{{ (item as Armor).driftstoneSlots }} 漂移槽</span>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="!filteredItems.length" class="text-center text-muted-foreground py-8 text-sm">
              找不到符合條件的{{ slotLabel }}
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

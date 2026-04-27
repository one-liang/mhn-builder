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
  (e: 'select', item: Weapon | Armor | null, actualSlot?: string): void
}>()

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()

const search = ref('')
const activeWeaponType = ref('all')
const activeArmorSlot = ref('head')

const WEAPON_TYPES = [
  { id: 'all', name: '全部' },
  { id: 'great-sword', name: '大劍' },
  { id: 'long-sword', name: '太刀' },
  { id: 'sword-and-shield', name: '單手劍' },
  { id: 'dual-blades', name: '雙刀' },
  { id: 'hammer', name: '大錘' },
  { id: 'hunting-horn', name: '狩獵笛' },
  { id: 'lance', name: '長槍' },
  { id: 'gunlance', name: '銃槍' },
  { id: 'switch-axe', name: '斬擊斧' },
  { id: 'charge-blade', name: '充能斧' },
  { id: 'insect-glaive', name: '操蟲棍' },
  { id: 'light-bowgun', name: '輕弩槍' },
  { id: 'heavy-bowgun', name: '重弩槍' },
  { id: 'bow', name: '弓' },
]

const ARMOR_SLOTS = [
  { id: 'head', name: '頭部' },
  { id: 'chest', name: '胸部' },
  { id: 'arms', name: '腕部' },
  { id: 'waist', name: '腰部' },
  { id: 'legs', name: '腿部' },
]

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = ''
      activeWeaponType.value = 'all'
      if (props.slotType && props.slotType !== 'weapon') {
        activeArmorSlot.value = props.slotType
      }
    }
  }
)

const isWeaponSlot = computed(() => props.slotType === 'weapon')

const slotLabel = computed(() => {
  if (!props.slotType) return ''
  if (isWeaponSlot.value) return '武器'
  return `${getPartName(activeArmorSlot.value)}防具`
})

const allWeapons = computed<Weapon[]>(() =>
  Object.values(equipmentStore.weapons).flat()
)

const items = computed<SelectableItem[]>(() => {
  if (!props.slotType) return []
  if (isWeaponSlot.value) {
    const weapons = allWeapons.value
    if (activeWeaponType.value === 'all') return weapons
    return weapons.filter(w => (w as Weapon).type === activeWeaponType.value)
  }
  return equipmentStore.getArmorByPart(activeArmorSlot.value as Armor['part'])
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
  const actualSlot = isWeaponSlot.value ? undefined : activeArmorSlot.value
  emit('select', item, actualSlot)
  close()
}

function onClear() {
  const actualSlot = isWeaponSlot.value ? undefined : activeArmorSlot.value
  emit('select', null, actualSlot)
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

          <!-- Search + category filters -->
          <div class="px-3 pt-3 pb-2 border-b border-border flex flex-col gap-2">
            <input
              v-model="search"
              type="text"
              :placeholder="`搜尋${slotLabel}名稱...`"
              class="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 min-h-[44px]"
            />
            <!-- Weapon type filter pills -->
            <div v-if="isWeaponSlot" class="flex gap-1.5 overflow-x-auto sm:overflow-x-visible sm:flex-wrap pb-0.5 sm:pb-0 scrollbar-none">
              <button
                v-for="wt in WEAPON_TYPES"
                :key="wt.id"
                class="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap"
                :class="activeWeaponType === wt.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'"
                @click="activeWeaponType = wt.id"
              >
                {{ wt.name }}
              </button>
            </div>
            <!-- Armor slot tabs -->
            <div v-else class="flex gap-1.5 overflow-x-auto sm:overflow-x-visible sm:flex-wrap pb-0.5 sm:pb-0 scrollbar-none">
              <button
                v-for="slot in ARMOR_SLOTS"
                :key="slot.id"
                class="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap"
                :class="activeArmorSlot === slot.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'"
                @click="activeArmorSlot = slot.id"
              >
                {{ slot.name }}
              </button>
            </div>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
            <!-- Clear option -->
            <button
              class="w-full py-2 mb-1 rounded-lg border border-dashed border-border hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              @click="onClear"
            >
              取消選擇
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
                <!-- Weapon: show item image -->
                <div
                  v-if="isWeaponSlot"
                  class="flex-shrink-0 w-12 h-12 rounded-md bg-secondary overflow-hidden"
                >
                  <img
                    :src="(item as Weapon).image"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  />
                </div>
                <!-- Armor: show part icon -->
                <div
                  v-else
                  class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-secondary text-primary/80"
                >
                  <ArmorPartIcon :part="activeArmorSlot" class="w-5 h-5" />
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
                    v-if="!isWeaponSlot && 'driftstoneSlots' in item && (item as Armor).driftstoneSlots > 0"
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

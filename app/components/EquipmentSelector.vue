<script setup lang="ts">
import { Check, Gem, X } from 'lucide-vue-next'
import type { Armor, Weapon } from '~/stores/equipment'
import { useEquipmentStore, getPartName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { useBuildStore, type BuildSlot } from '~/stores/build'

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
const buildStore = useBuildStore()
const { imageUrl } = useImageUrl()

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

const ELEMENT_NAMES: Record<string, string> = {
  fire: '火', water: '水', thunder: '雷', ice: '冰', dragon: '龍',
  poison: '毒', paralysis: '麻', sleep: '眠', blast: '爆',
}

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

const currentItemId = computed(() => {
  if (!props.slotType) return null
  const slot = (isWeaponSlot.value ? 'weapon' : activeArmorSlot.value) as BuildSlot
  return buildStore[slot]?.id ?? null
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

function weaponMeta(w: Weapon): string {
  const parts = [`攻擊 ${w.attack}`]
  if (w.element) parts.push(`${ELEMENT_NAMES[w.element.type] || w.element.type} ${w.element.value}`)
  if (w.affinity) parts.push(`會心 ${w.affinity > 0 ? '+' : ''}${w.affinity}%`)
  return parts.join(' · ')
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

function hideImage(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <BottomSheet
    :open="open"
    :title="`選擇${slotLabel}`"
    :eyebrow="isWeaponSlot ? 'Weapon' : 'Armor'"
    @close="close"
  >
    <template #toolbar>
      <SearchField v-model="search" :placeholder="`搜尋${slotLabel}名稱`" />
      <FilterChips
        v-if="isWeaponSlot"
        v-model="activeWeaponType"
        :options="WEAPON_TYPES"
        label="武器類型"
        :wrap="false"
      />
      <FilterChips
        v-else
        v-model="activeArmorSlot"
        :options="ARMOR_SLOTS"
        label="防具部位"
        :wrap="false"
      >
        <template #icon="{ option }">
          <ArmorPartIcon :part="option.id" class="size-3.5" aria-hidden="true" />
        </template>
      </FilterChips>
    </template>

    <div class="flex flex-col gap-3 p-3 sm:p-4">
      <div class="flex items-center justify-between px-1">
        <p class="text-xs text-muted-foreground">
          <span class="font-num text-sm font-semibold tabular-nums text-foreground">{{ filteredItems.length }}</span> 件
        </p>
        <button
          v-if="currentItemId"
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          @click="onClear"
        >
          <X class="size-3.5" aria-hidden="true" />
          卸下目前裝備
        </button>
      </div>

      <ul v-if="filteredItems.length" class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
        <li v-for="item in filteredItems" :key="item.id">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/70"
            :class="currentItemId === item.id ? 'bg-accent/60' : ''"
            :aria-current="currentItemId === item.id ? 'true' : undefined"
            @click="onSelect(item)"
          >
            <div class="relative flex size-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[radial-gradient(circle_at_50%_35%,var(--card),var(--secondary))] ring-1 ring-inset ring-border">
              <WeaponTypeIcon
                v-if="isWeaponSlot"
                :type="(item as Weapon).type"
                class="size-5 text-muted-foreground/50"
              />
              <ArmorPartIcon
                v-else
                :part="activeArmorSlot"
                class="size-5 text-muted-foreground/50"
              />
              <img
                v-if="item.image"
                :src="imageUrl(item.image)"
                :alt="item.name"
                class="absolute inset-0 size-full object-contain p-0.5"
                loading="lazy"
                @error="hideImage"
              />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-bold text-foreground">{{ item.name }}</span>
                <span
                  v-if="currentItemId === item.id"
                  class="inline-flex flex-shrink-0 items-center gap-0.5 text-[0.6875rem] font-medium text-accent-foreground"
                >
                  <Check class="size-3" aria-hidden="true" />已裝備
                </span>
              </div>
              <p class="mt-0.5 flex items-center gap-2 text-[0.6875rem] text-muted-foreground">
                <template v-if="isWeaponSlot">{{ weaponMeta(item as Weapon) }}</template>
                <template v-else>
                  <span>防禦 <span class="font-num text-xs font-semibold tabular-nums text-foreground">{{ (item as Armor).defense }}</span></span>
                  <span
                    v-if="(item as Armor).driftstoneSlots > 0"
                    class="inline-flex items-center gap-0.5 text-stone"
                  >
                    <Gem class="size-3" aria-hidden="true" />
                    {{ (item as Armor).driftstoneSlots }} 漂移槽
                  </span>
                </template>
              </p>
              <div v-if="itemSkills(item).length" class="mt-1.5 flex flex-wrap gap-1">
                <SkillBadge
                  v-for="s in itemSkills(item)"
                  :key="s.id"
                  :name="s.name"
                  :level="s.level"
                  size="sm"
                />
              </div>
            </div>
          </button>
        </li>
      </ul>

      <p v-else class="py-12 text-center text-sm text-muted-foreground">
        找不到符合條件的{{ slotLabel }}
      </p>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import { Check, Gem } from 'lucide-vue-next'
import type { Armor, Weapon } from '~/stores/equipment'
import { useEquipmentStore, getPartName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { useBuildStore, type BuildSlot } from '~/stores/build'
import { monsterOfArmor, monsterOfWeapon, monsterTermsOf } from '~/lib/monsters'
import { searchList } from '~/lib/search'

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
  { id: 'dual-blades', name: '雙劍' },
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

const targetSlot = computed<BuildSlot>(() =>
  isWeaponSlot.value ? 'weapon' : (activeArmorSlot.value as BuildSlot)
)
const current = computed(() => buildStore[targetSlot.value])

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

function monsterOf(item: SelectableItem) {
  return isWeaponSlot.value ? monsterOfWeapon(item.id) : monsterOfArmor(item.id)
}

const filteredItems = computed(() =>
  searchList(items.value, search.value, item => ({
    primary: item.name,
    others: [
      item.nameEn,
      ...('setName' in item ? [item.setName, item.setNameEn] : []),
      ...monsterTermsOf(monsterOf(item)),
    ],
  }))
)

function itemSkills(item: SelectableItem): { id: string; name: string; level: number }[] {
  return item.skills.map((s) => ({
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
</script>

<template>
  <SheetDialog
    :open="open"
    :title="`選擇${slotLabel}`"
    @update:open="emit('update:open', $event)"
  >
    <template #controls>
      <div class="px-4 pt-3 pb-1">
        <SearchField
          v-model="search"
          :label="`搜尋${slotLabel}`"
          :placeholder="`搜尋${slotLabel}或魔物名稱`"
          autofocus
        />
      </div>
      <FilterTabs
        v-if="isWeaponSlot"
        v-model="activeWeaponType"
        :items="WEAPON_TYPES"
        label="武器類型"
      >
        <template #icon="{ item }">
          <WeaponTypeIcon v-if="item.id !== 'all'" :type="item.id" class="size-4" aria-hidden="true" />
        </template>
      </FilterTabs>
      <FilterTabs
        v-else
        v-model="activeArmorSlot"
        :items="ARMOR_SLOTS"
        label="防具部位"
      >
        <template #icon="{ item }">
          <ArmorPartIcon :part="item.id" class="size-4" aria-hidden="true" />
        </template>
      </FilterTabs>
    </template>

    <ul class="divide-y divide-rule">
      <li v-for="item in filteredItems" :key="item.id">
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-2.5 min-h-[68px] text-left transition-colors duration-150 hover:bg-inset"
          :class="current?.id === item.id ? 'bg-inset' : ''"
          :aria-current="current?.id === item.id ? 'true' : undefined"
          @click="onSelect(item)"
        >
          <span class="relative plate flex items-center justify-center size-12 flex-shrink-0">
            <img
              :src="imageUrl(item.image)"
              :alt="item.name"
              width="48"
              height="48"
              class="size-full object-contain"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
            />
            <img
              v-if="monsterOf(item)"
              :src="imageUrl(monsterOf(item)!.icon)"
              :alt="monsterOf(item)!.name"
              width="22"
              height="22"
              class="absolute -right-1 -bottom-1 size-[22px] rounded-full bg-panel border border-rule object-contain p-px"
              loading="lazy"
            />
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-[15px] font-bold leading-snug truncate">{{ item.name }}</span>
            <span class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[13px] text-ink-2">
              <SkillBadge v-for="s in itemSkills(item)" :key="s.id" :name="s.name" :level="s.level" />
              <span
                v-if="!isWeaponSlot && (item as Armor).driftstoneSlots > 0"
                class="inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Gem :size="13" :stroke-width="2" aria-hidden="true" />
                漂流石槽 <span class="stamp font-bold text-ink text-[14px] leading-none">{{ (item as Armor).driftstoneSlots }}</span>
              </span>
            </span>
          </span>
          <span
            v-if="current?.id === item.id"
            class="flex items-center gap-1 text-[12px] font-bold text-ink flex-shrink-0"
          >
            <Check :size="16" :stroke-width="2.5" aria-hidden="true" />裝備中
          </span>
        </button>
      </li>
    </ul>

    <p v-if="!filteredItems.length" class="px-4 py-12 text-center text-[14px] text-ink-2">
      <template v-if="search.trim()">找不到符合「{{ search.trim() }}」的{{ slotLabel }}</template>
      <template v-else>這個分類目前沒有{{ slotLabel }}資料</template>
    </p>

    <template v-if="current" #footer>
      <button
        type="button"
        class="w-full h-11 rounded-sm border border-rule-strong text-[14px] font-bold text-ink hover:bg-inset transition-colors duration-200"
        @click="onClear"
      >
        卸下目前的{{ slotLabel }}
      </button>
    </template>
  </SheetDialog>
</template>

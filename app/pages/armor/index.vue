<script setup lang="ts">
import { useEquipmentStore, getPartName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { countByMonster, gearBadge, getMonster, monsterOfArmor, monstersWithArmor, monsterTermsOf } from '~/lib/monsters'
import { searchList } from '~/lib/search'

useSeoMeta({
  title: '防具一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有防具資料，包含防禦力、技能、屬性耐性。按部位篩選頭部、胸部、腕部、腰部、腿部防具。',
  ogTitle: '防具一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有防具資料，按部位篩選。',
})

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()

await Promise.all([equipmentStore.load(), skillStore.load()])

const activePart = ref<string>('all')
const search = useQuerySearch()
const monsterFilter = useQuerySearch('monster')

const monsterOptions = monstersWithArmor()
const monsterCounts = computed(() => countByMonster(equipmentStore.allArmor, a => monsterOfArmor(a.id)))
const selectedMonster = computed(() => getMonster(monsterFilter.value))

const parts = [
  { id: 'all', name: '全部' },
  { id: 'head', name: '頭部' },
  { id: 'chest', name: '胸部' },
  { id: 'arms', name: '腕部' },
  { id: 'waist', name: '腰部' },
  { id: 'legs', name: '腿部' },
]

const filteredArmor = computed(() => {
  let list = activePart.value === 'all'
    ? equipmentStore.allArmor
    : equipmentStore.getArmorByPart(activePart.value as any)
  if (selectedMonster.value) list = list.filter(a => monsterOfArmor(a.id)?.id === selectedMonster.value!.id)
  return searchList(list, search.value, a => ({
    primary: a.name,
    others: [a.nameEn, a.setName, a.setNameEn, ...monsterTermsOf(monsterOfArmor(a.id))],
  }))
})

/** The monster's crest, or the set icon for material sets with no monster. */
const armorIcon = (id: string) => gearBadge({ id }, 'armor')

function resolveSkillName(skillId: string) {
  return skillStore.getById(skillId)?.name || skillId
}
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-10">
    <PageHead title="防具">
      共 <span class="stamp font-bold text-ink">{{ equipmentStore.allArmor.length }}</span> 件<template v-if="filteredArmor.length !== equipmentStore.allArmor.length">，顯示 <span class="stamp font-bold text-ink">{{ filteredArmor.length }}</span> 件</template>
    </PageHead>

    <div class="sticky top-14 md:top-16 z-20 bg-ground pb-3">
      <div class="px-4 md:px-0 pb-2">
        <SearchField v-model="search" label="搜尋防具" placeholder="搜尋防具、套裝或魔物，例如「銀火」" />
      </div>
      <FilterTabs v-model="activePart" :items="parts" label="防具部位">
        <template #before>
          <MonsterFilter v-model="monsterFilter" :monsters="monsterOptions" :counts="monsterCounts" unit="件" />
        </template>
        <template #icon="{ item }">
          <ArmorPartIcon v-if="item.id !== 'all'" :part="item.id" class="size-4" aria-hidden="true" />
        </template>
      </FilterTabs>
    </div>

    <MonsterCard
      v-if="selectedMonster"
      :monster="selectedMonster"
      :summary="`防具 ${monsterCounts[selectedMonster.id] ?? 0} 件`"
      :link="{ to: `/weapons?monster=${selectedMonster.id}`, label: '武器' }"
    />

    <ul v-if="filteredArmor.length" class="card mx-4 md:mx-0 overflow-hidden divide-y divide-rule">
      <li v-for="item in filteredArmor" :key="item.id">
        <EquipmentCard
          :id="item.id"
          :name="item.name"
          :unofficial="item.source === 'manual'"
          :skills="item.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
          :image="item.image"
          :armor-part="item.part"
          :to="`/armor/${item.id}`"
          :set-name="[item.setName, getPartName(item.part)].filter(Boolean).join('・')"
          :stats="[['防禦', String(item.defense)], ...(item.driftstoneSlots ? [['漂流石槽', String(item.driftstoneSlots)] as [string, string]] : [])]"
          :monster-icon="armorIcon(item.id)?.icon"
        />
      </li>
    </ul>

    <p v-else class="card mx-4 md:mx-0 px-4 py-12 text-center text-[14px] text-ink-2">
      找不到符合「{{ search.trim() }}」的防具
    </p>
  </div>
</template>

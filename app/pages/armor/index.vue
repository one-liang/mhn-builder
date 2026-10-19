<script setup lang="ts">
import { useEquipmentStore, getPartName, getMonsterIconKey } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'

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
const search = ref('')

const parts = [
  { id: 'all', name: '全部' },
  { id: 'head', name: '頭部' },
  { id: 'chest', name: '胸部' },
  { id: 'arms', name: '腕部' },
  { id: 'waist', name: '腰部' },
  { id: 'legs', name: '腿部' },
]

const filteredArmor = computed(() => {
  const list = activePart.value === 'all'
    ? equipmentStore.allArmor
    : equipmentStore.getArmorByPart(activePart.value as any)
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(a =>
    a.name.toLowerCase().includes(q) ||
    (a.setName ?? '').toLowerCase().includes(q) ||
    (a.nameEn ?? '').toLowerCase().includes(q)
  )
})

function resolveSkillName(skillId: string) {
  return skillStore.getById(skillId)?.name || skillId
}
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-8">
    <PageHead title="防具">
      共 <span class="stamp text-[15px] font-bold text-ink">{{ equipmentStore.allArmor.length }}</span> 件，
      目前顯示 <span class="stamp text-[15px] font-bold text-ink">{{ filteredArmor.length }}</span> 件
    </PageHead>

    <div class="sticky top-14 z-20 bg-ground border-b border-rule md:border-0">
      <div class="px-4 md:px-0 pb-1">
        <SearchField v-model="search" label="搜尋防具" placeholder="搜尋防具或套裝名稱" />
      </div>
      <FilterTabs v-model="activePart" :items="parts" label="防具部位" class="md:px-0 md:-mx-3">
        <template #icon="{ item }">
          <ArmorPartIcon v-if="item.id !== 'all'" :part="item.id" class="size-4" aria-hidden="true" />
        </template>
      </FilterTabs>
    </div>

    <ul class="bg-panel border-b md:border md:rounded-md md:mt-3 border-rule divide-y divide-rule">
      <li v-for="item in filteredArmor" :key="item.id">
        <EquipmentCard
          :id="item.id"
          :name="item.name"
          :skills="item.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
          :image="item.image"
          :armor-part="item.part"
          :to="`/armor/${item.id}`"
          :set-name="[item.setName, getPartName(item.part)].filter(Boolean).join('・')"
          :stats="[['防禦', String(item.defense)], ...(item.driftstoneSlots ? [['漂流石槽', String(item.driftstoneSlots)] as [string, string]] : [])]"
          :monster-icon-key="getMonsterIconKey(item.id)"
        />
      </li>
    </ul>

    <p v-if="!filteredArmor.length" class="px-4 py-12 text-center text-[14px] text-ink-2">
      找不到符合的防具
    </p>
  </div>
</template>

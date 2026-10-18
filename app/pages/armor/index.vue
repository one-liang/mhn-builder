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

const parts = [
  { id: 'all', name: '全部' },
  { id: 'head', name: '頭部' },
  { id: 'chest', name: '胸部' },
  { id: 'arms', name: '腕部' },
  { id: 'waist', name: '腰部' },
  { id: 'legs', name: '腿部' },
]

const filteredArmor = computed(() => {
  if (activePart.value === 'all') return equipmentStore.allArmor
  return equipmentStore.getArmorByPart(activePart.value as any)
})

function resolveSkillName(skillId: string) {
  return skillStore.getById(skillId)?.name || skillId
}

function armorSubtitle(setName: string, part: string) {
  return setName && setName !== '無' ? `${setName} · ${getPartName(part)}` : getPartName(part)
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6">
    <PageHeader
      title="防具圖鑑"
      eyebrow="Armor"
      :count="filteredArmor.length"
      count-label="件"
    />

    <!-- Part Filter -->
    <div class="mb-4">
      <FilterChips v-model="activePart" :options="parts" label="防具部位">
        <template #icon="{ option }">
          <ArmorPartIcon v-if="option.id !== 'all'" :part="option.id" class="size-3.5" aria-hidden="true" />
        </template>
      </FilterChips>
    </div>

    <!-- Armor List -->
    <ul v-if="filteredArmor.length" class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      <li v-for="item in filteredArmor" :key="item.id">
        <EquipmentCard
          :id="item.id"
          :name="item.name"
          :skills="item.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
          :image="item.image"
          :armor-part="item.part"
          :to="`/armor/${item.id}`"
          :subtitle="armorSubtitle(item.setName, item.part)"
          :stats="[{ label: '防禦', value: item.defense }]"
          :monster-icon-key="getMonsterIconKey(item.id)"
        />
      </li>
    </ul>

    <p v-else class="py-16 text-center text-sm text-muted-foreground">
      暫無資料
    </p>
  </div>
</template>

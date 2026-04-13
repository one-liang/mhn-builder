<script setup lang="ts">
import { useEquipmentStore, getPartName } from '~/stores/equipment'
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
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <h1 class="text-xl font-bold text-foreground mb-4">防具一覽</h1>

    <!-- Part Filter -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
      <button
        v-for="part in parts"
        :key="part.id"
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px]"
        :class="activePart === part.id
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-muted-foreground hover:text-foreground'"
        @click="activePart = part.id"
      >
        {{ part.name }}
      </button>
    </div>

    <!-- Armor List -->
    <div class="flex flex-col gap-2">
      <EquipmentCard
        v-for="item in filteredArmor"
        :key="item.id"
        :id="item.id"
        :name="item.name"
        :skills="item.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
        :image="item.image"
        :armor-part="item.part"
        :to="`/armor/${item.id}`"
        :subtitle="`${item.setName} | ${getPartName(item.part)} | 防禦 ${item.defense}`"
      />
    </div>

    <p v-if="!filteredArmor.length" class="text-center text-muted-foreground py-8">
      暫無資料
    </p>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

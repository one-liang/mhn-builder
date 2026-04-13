<script setup lang="ts">
import { useEquipmentStore, getWeaponTypeName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'

const route = useRoute()
const type = route.params.type as string
const typeName = getWeaponTypeName(type)

useSeoMeta({
  title: () => `${typeName}一覽 | 最強獵人 - MHN 配裝模擬器`,
  description: () => `瀏覽 Monster Hunter Now 所有${typeName}武器資料，包含攻擊力、屬性、會心率、技能。`,
  ogTitle: () => `${typeName}一覽 | 最強獵人`,
  ogDescription: () => `瀏覽 MHN 所有${typeName}武器資料。`,
})

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()
await Promise.all([equipmentStore.load(), skillStore.load()])

const weapons = computed(() => equipmentStore.getWeaponsByType(type))

const elementNames: Record<string, string> = {
  fire: '火', water: '水', thunder: '雷', ice: '冰', dragon: '龍',
  poison: '毒', paralysis: '麻', sleep: '眠', blast: '爆',
}

function resolveSkillName(skillId: string) {
  return skillStore.getById(skillId)?.name || skillId
}
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <NuxtLink to="/weapons" class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      返回武器類型
    </NuxtLink>

    <h1 class="text-xl font-bold text-foreground mb-4">{{ typeName }}</h1>

    <div class="flex flex-col gap-2">
      <EquipmentCard
        v-for="weapon in weapons"
        :key="weapon.id"
        :id="weapon.id"
        :name="weapon.name"
        :rarity="weapon.rarity"
        :skills="weapon.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
        :image="weapon.image"
        :weapon-type="type"
        :to="`/weapons/${type}/${weapon.id}`"
        :subtitle="`攻擊 ${weapon.attack}${weapon.element ? ` | ${elementNames[weapon.element.type] || weapon.element.type} ${weapon.element.value}` : ''}${weapon.affinity ? ` | 會心 ${weapon.affinity > 0 ? '+' : ''}${weapon.affinity}%` : ''}`"
      />
    </div>

    <p v-if="!weapons.length" class="text-center text-muted-foreground py-8">暫無資料</p>
  </div>
</template>

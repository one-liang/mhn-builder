<script setup lang="ts">
import { useEquipmentStore, getWeaponTypeName, type Weapon } from '~/stores/equipment'
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

function weaponStats(weapon: Weapon) {
  const stats: { label: string; value: string | number; dot?: string; tone?: 'positive' | 'negative' }[] = [
    { label: '攻擊', value: weapon.attack },
  ]
  if (weapon.element) {
    stats.push({
      label: elementNames[weapon.element.type] || weapon.element.type,
      value: weapon.element.value,
      dot: `var(--color-element-${weapon.element.type})`,
    })
  }
  if (weapon.affinity) {
    stats.push({
      label: '會心',
      value: `${weapon.affinity > 0 ? '+' : ''}${weapon.affinity}%`,
      tone: weapon.affinity > 0 ? 'positive' : 'negative',
    })
  }
  return stats
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6">
    <PageHeader
      :title="typeName"
      eyebrow="Weapons"
      :count="weapons.length"
      count-label="把"
      :back="{ to: '/weapons', label: '武器類型' }"
    />

    <ul v-if="weapons.length" class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      <li v-for="weapon in weapons" :key="weapon.id">
        <EquipmentCard
          :id="weapon.id"
          :name="weapon.name"
          :skills="weapon.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
          :image="weapon.image"
          :weapon-type="type"
          :to="`/weapons/${type}/${weapon.id}`"
          :stats="weaponStats(weapon)"
        />
      </li>
    </ul>

    <p v-else class="py-16 text-center text-sm text-muted-foreground">暫無資料</p>
  </div>
</template>

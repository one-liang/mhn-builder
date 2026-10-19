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

function statsFor(w: (typeof weapons.value)[number]): [string, string][] {
  const out: [string, string][] = [['攻擊', String(w.attack)]]
  if (w.element) out.push([elementNames[w.element.type] || w.element.type, String(w.element.value)])
  if (w.affinity) out.push(['會心', `${w.affinity > 0 ? '+' : ''}${w.affinity}%`])
  return out
}

function resolveSkillName(skillId: string) {
  return skillStore.getById(skillId)?.name || skillId
}
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-8">
    <PageHead :title="typeName" back-to="/weapons" back-label="所有武器">
      共 <span class="stamp text-[15px] font-bold text-ink">{{ weapons.length }}</span> 把
      <template #aside>
        <span class="flex items-center justify-center size-12 rounded-md bg-shell text-shell-ink flex-shrink-0">
          <WeaponTypeIcon :type="type" class="size-7" aria-hidden="true" />
        </span>
      </template>
    </PageHead>

    <ul class="bg-panel border-y md:border md:rounded-md border-rule divide-y divide-rule">
      <li v-for="weapon in weapons" :key="weapon.id">
        <EquipmentCard
          :id="weapon.id"
          :name="weapon.name"
          :skills="weapon.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
          :image="weapon.image"
          :weapon-type="type"
          :to="`/weapons/${type}/${weapon.id}`"
          :stats="statsFor(weapon)"
        />
      </li>
    </ul>

    <p v-if="!weapons.length" class="px-4 py-12 text-center text-[14px] text-ink-2">這個武器類型目前沒有資料</p>
  </div>
</template>

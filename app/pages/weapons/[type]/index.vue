<script setup lang="ts">
import { useEquipmentStore, getWeaponTypeName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { countByMonster, getMonster, monsterOfWeapon, monstersOfWeapons, monsterTermsOf } from '~/lib/monsters'
import { searchList } from '~/lib/search'

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

const allOfType = computed(() => equipmentStore.getWeaponsByType(type))
const search = useQuerySearch()
const monsterFilter = useQuerySearch('monster')

// Monsters that have a weapon of this type
const monsters = computed(() => monstersOfWeapons(allOfType.value.map(w => w.id)))
const monsterCounts = computed(() => countByMonster(allOfType.value, w => monsterOfWeapon(w.id)))
const selectedMonster = computed(() => getMonster(monsterFilter.value))

const weapons = computed(() => {
  const list = monsterFilter.value
    ? allOfType.value.filter(w => monsterOfWeapon(w.id)?.id === monsterFilter.value)
    : allOfType.value
  return searchList(list, search.value, w => ({
    primary: w.name,
    others: [w.nameEn, ...monsterTermsOf(monsterOfWeapon(w.id))],
  }))
})

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
  <div class="max-w-3xl mx-auto md:px-6 pb-10">
    <PageHead :title="typeName" back-to="/weapons" back-label="所有武器">
      共 <span class="stamp font-bold text-ink">{{ allOfType.length }}</span> 把<template v-if="weapons.length !== allOfType.length">，顯示 <span class="stamp font-bold text-ink">{{ weapons.length }}</span> 把</template>
      <template #aside>
        <span class="flex items-center justify-center size-14 rounded-full bg-shell text-shell-ink flex-shrink-0">
          <WeaponTypeIcon :type="type" class="size-7" aria-hidden="true" />
        </span>
      </template>
    </PageHead>

    <div class="sticky top-14 md:top-16 z-20 bg-ground px-4 md:px-0 pb-3">
      <SearchField v-model="search" :label="`搜尋${typeName}`" placeholder="搜尋武器或魔物，例如「銀火」" />
    </div>
    <div class="px-4 md:px-0 pb-4 flex">
      <MonsterFilter v-model="monsterFilter" :monsters="monsters" :counts="monsterCounts" unit="把" />
    </div>

    <MonsterCard
      v-if="selectedMonster"
      :monster="selectedMonster"
      :summary="`${typeName} ${monsterCounts[selectedMonster.id] ?? 0} 把`"
      :link="{ to: `/weapons?monster=${selectedMonster.id}`, label: '全部武器' }"
    />

    <ul v-if="weapons.length" class="card mx-4 md:mx-0 overflow-hidden divide-y divide-rule">
      <li v-for="weapon in weapons" :key="weapon.id">
        <EquipmentCard
          :id="weapon.id"
          :name="weapon.name"
          :unofficial="weapon.source === 'manual'"
          :skills="weapon.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
          :image="weapon.image"
          :weapon-type="type"
          :to="`/weapons/${type}/${weapon.id}`"
          :stats="statsFor(weapon)"
          :monster-icon="monsterOfWeapon(weapon.id)?.icon"
          :monster-name="monsterOfWeapon(weapon.id)?.name"
        />
      </li>
    </ul>

    <p v-else class="card mx-4 md:mx-0 px-4 py-12 text-center text-[14px] text-ink-2">
      {{ allOfType.length ? '找不到符合條件的武器' : '這個武器類型目前沒有資料' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { useEquipmentStore, getWeaponTypeName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { monsterOfWeapon, monsterTermsOf } from '~/lib/monsters'
import { searchList } from '~/lib/search'

useSeoMeta({
  title: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  description: '瀏覽 Monster Hunter Now 所有武器類型，包含大劍、太刀、單手劍、雙劍、大錘、狩獵笛、長槍、銃槍、斬擊斧、充能斧、操蟲棍、輕弩槍、重弩槍、弓等 14 種武器資料。',
  ogTitle: '武器一覽 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '瀏覽 MHN 所有武器類型與資料。',
})

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()
await Promise.all([equipmentStore.load(), skillStore.load()])

const total = computed(() => equipmentStore.weaponTypes.reduce((n, wt) => n + wt.count, 0))

// Searching looks across every weapon type, so a monster name finds all of its weapons
const search = useQuerySearch()
const results = computed(() => {
  if (!search.value.trim()) return []
  const all = Object.values(equipmentStore.weapons).flat()
  return searchList(all, search.value, w => ({
    primary: w.name,
    others: [w.nameEn, ...monsterTermsOf(monsterOfWeapon(w.id))],
  }))
})

function resolveSkillName(skillId: string) {
  return skillStore.getById(skillId)?.name || skillId
}
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-8">
    <PageHead title="武器">
      <span class="stamp text-[15px] font-bold text-ink">{{ equipmentStore.weaponTypes.length }}</span> 種武器，
      共 <span class="stamp text-[15px] font-bold text-ink">{{ total }}</span> 把
    </PageHead>

    <div class="px-4 md:px-0 pb-3">
      <SearchField v-model="search" label="搜尋所有武器" placeholder="搜尋武器或魔物，例如「銀火」" />
    </div>

    <template v-if="search.trim()">
      <p class="px-4 md:px-0 pb-2 text-[13px] text-ink-2">
        找到 <span class="stamp text-[15px] font-bold text-ink">{{ results.length }}</span> 把
      </p>
      <ul v-if="results.length" class="bg-panel border-y md:border md:rounded-md border-rule divide-y divide-rule">
        <li v-for="weapon in results" :key="weapon.id">
          <EquipmentCard
            :id="weapon.id"
            :name="weapon.name"
            :skills="weapon.skills.map(s => ({ ...s, name: resolveSkillName(s.skillId) }))"
            :image="weapon.image"
            :weapon-type="weapon.type"
            :to="`/weapons/${weapon.type}/${weapon.id}`"
            :set-name="getWeaponTypeName(weapon.type)"
            :stats="[['攻擊', String(weapon.attack)]]"
            :monster-icon="monsterOfWeapon(weapon.id)?.icon"
            :monster-name="monsterOfWeapon(weapon.id)?.name"
          />
        </li>
      </ul>
      <p v-else class="px-4 py-12 text-center text-[14px] text-ink-2">找不到符合「{{ search.trim() }}」的武器</p>
    </template>

    <ul v-else class="grid sm:grid-cols-2 bg-panel border-y md:border md:rounded-md border-rule divide-y divide-rule sm:divide-y-0 sm:gap-px sm:bg-rule overflow-hidden">
      <li v-for="wt in equipmentStore.weaponTypes" :key="wt.type" class="bg-panel">
        <NuxtLink
          :to="`/weapons/${wt.type}`"
          class="flex items-center gap-4 pl-4 pr-3 h-[68px] transition-colors duration-150 hover:bg-inset"
        >
          <span class="flex items-center justify-center size-11 rounded-md bg-shell text-shell-ink flex-shrink-0">
            <WeaponTypeIcon :type="wt.type" class="size-6" aria-hidden="true" />
          </span>
          <span class="flex-1 min-w-0 text-[17px] font-bold">{{ wt.name }}</span>
          <span class="stamp text-[22px] font-extrabold leading-none">{{ wt.count }}</span>
          <span class="text-[12px] text-ink-2 -ml-2">把</span>
          <ChevronRight :size="18" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

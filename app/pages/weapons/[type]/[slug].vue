<script setup lang="ts">
import { useEquipmentStore, getWeaponTypeName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { useMaterialStore } from '~/stores/material'

const route = useRoute()
const type = route.params.type as string
const slug = route.params.slug as string
const typeName = getWeaponTypeName(type)

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()
const materialStore = useMaterialStore()
await Promise.all([equipmentStore.load(), skillStore.load(), materialStore.load()])

const weapon = computed(() => equipmentStore.getWeaponById(type, slug))

useSeoMeta({
  title: () => weapon.value ? `${weapon.value.name} | 最強獵人 - MHN 配裝模擬器` : '武器詳情 | 最強獵人',
  description: () => weapon.value ? `${weapon.value.name} - ${typeName}，攻擊力 ${weapon.value.attack}，稀有度 ${weapon.value.rarity}。` : '',
  ogTitle: () => weapon.value ? `${weapon.value.name} | 最強獵人` : '',
  ogDescription: () => weapon.value ? `${typeName}，攻擊力 ${weapon.value.attack}` : '',
})

const elementNames: Record<string, string> = {
  fire: '火', water: '水', thunder: '雷', ice: '冰', dragon: '龍',
  poison: '毒', paralysis: '麻', sleep: '眠', blast: '爆',
}
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <NuxtLink :to="`/weapons/${type}`" class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      返回{{ typeName }}列表
    </NuxtLink>

    <template v-if="weapon">
      <div class="flex items-start gap-4 mb-6">
        <div class="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <img v-if="weapon.image" :src="weapon.image" :alt="weapon.name" class="w-full h-full object-cover rounded-lg" @error="($event.target as HTMLImageElement).style.display = 'none'" />
          <WeaponTypeIcon v-else :type="type" class="w-10 h-10 text-primary/80" />
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <RarityIndicator :rarity="weapon.rarity" />
            <span class="text-xs text-muted-foreground">稀有度 {{ weapon.rarity }}</span>
          </div>
          <h1 class="text-lg font-bold text-foreground">{{ weapon.name }}</h1>
          <p class="text-xs text-muted-foreground mt-1">{{ typeName }}</p>
        </div>
      </div>

      <!-- Stats -->
      <section class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">數值</h2>
        <div class="grid grid-cols-3 gap-2">
          <div class="flex flex-col items-center p-3 rounded-lg bg-card border border-border">
            <span class="text-[10px] text-muted-foreground">攻擊力</span>
            <span class="text-lg font-bold text-foreground">{{ weapon.attack }}</span>
          </div>
          <div class="flex flex-col items-center p-3 rounded-lg bg-card border border-border">
            <span class="text-[10px] text-muted-foreground">會心率</span>
            <span
              class="text-lg font-bold"
              :class="weapon.affinity > 0 ? 'text-green-400' : weapon.affinity < 0 ? 'text-red-400' : 'text-muted-foreground'"
            >
              {{ weapon.affinity > 0 ? '+' : '' }}{{ weapon.affinity }}%
            </span>
          </div>
          <div class="flex flex-col items-center p-3 rounded-lg bg-card border border-border">
            <span class="text-[10px] text-muted-foreground">屬性</span>
            <template v-if="weapon.element">
              <span class="text-lg font-bold text-foreground">{{ weapon.element.value }}</span>
              <span class="text-[10px] text-muted-foreground">{{ elementNames[weapon.element.type] || weapon.element.type }}</span>
            </template>
            <span v-else class="text-sm text-muted-foreground">無</span>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section v-if="weapon.skills.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">技能</h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="skill in weapon.skills"
            :key="skill.skillId"
            :to="`/skills/${skill.skillId}`"
            class="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <span class="text-sm text-foreground">{{ skillStore.getById(skill.skillId)?.name || skill.skillId }}</span>
            <SkillBadge :name="skillStore.getById(skill.skillId)?.name || skill.skillId" :level="skill.level" />
          </NuxtLink>
        </div>
      </section>

      <!-- Materials -->
      <section v-if="weapon.materials.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">所需素材</h2>
        <div class="bg-card rounded-lg border border-border divide-y divide-border">
          <div v-for="mat in weapon.materials" :key="mat.materialId" class="flex items-center justify-between px-3 py-2">
            <span class="text-sm text-foreground">{{ materialStore.getName(mat.materialId) }}</span>
            <span class="text-sm text-primary font-medium">x{{ mat.quantity }}</span>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="text-center py-16 text-muted-foreground">找不到此武器</div>
  </div>
</template>

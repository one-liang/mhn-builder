<script setup lang="ts">
import { useEquipmentStore, getWeaponTypeName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'

const route = useRoute()
const type = route.params.type as string
const slug = route.params.slug as string
const typeName = getWeaponTypeName(type)

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()
await Promise.all([equipmentStore.load(), skillStore.load()])

const weapon = computed(() => equipmentStore.getWeaponById(type, slug))

useSeoMeta({
  title: () => weapon.value ? `${weapon.value.name} | 最強獵人 - MHN 配裝模擬器` : '武器詳情 | 最強獵人',
  description: () => weapon.value ? `${weapon.value.name} - ${typeName}，滿級攻擊力 ${weapon.value.attack}。` : '',
  ogTitle: () => weapon.value ? `${weapon.value.name} | 最強獵人` : '',
  ogDescription: () => weapon.value ? `${typeName}，滿級攻擊力 ${weapon.value.attack}` : '',
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

      <!-- SP技能 -->
      <section v-if="weapon.spSkill" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">SP技能</h2>
        <div class="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <span class="text-[10px] font-bold text-amber-400 border border-amber-400/60 rounded px-1 py-0.5 shrink-0">SP</span>
          <span class="text-sm text-foreground">{{ weapon.spSkill.replace('【SP】', '') }}</span>
        </div>
      </section>

      <!-- 裝備技能 -->
      <section v-if="weapon.skills.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">裝備技能</h2>
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

      <!-- 彈藥種類（輕/重弩） -->
      <section v-if="weapon.ammo?.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">彈藥種類</h2>
        <div class="rounded-lg overflow-hidden border border-border">
          <table class="w-full text-xs">
            <thead class="bg-muted/50">
              <tr>
                <th class="text-left px-3 py-2 text-muted-foreground font-medium">名稱</th>
                <th class="text-center px-2 py-2 text-muted-foreground font-medium">裝填數</th>
                <th class="text-center px-2 py-2 text-muted-foreground font-medium">後座力</th>
                <th class="text-center px-2 py-2 text-muted-foreground font-medium">填彈</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ammo in weapon.ammo" :key="ammo.name" class="border-t border-border">
                <td class="px-3 py-2 text-foreground">{{ ammo.name }}</td>
                <td class="text-center px-2 py-2 text-foreground">{{ ammo.capacity }}</td>
                <td class="text-center px-2 py-2 text-foreground">{{ ammo.recoil }}</td>
                <td class="text-center px-2 py-2 text-foreground">{{ ammo.reload }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 蓄力射擊（弓） -->
      <section v-if="weapon.chargingShots?.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">蓄力射擊</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="shot in weapon.chargingShots"
            :key="shot"
            class="px-2 py-1 rounded text-xs bg-card border border-border text-foreground"
          >{{ shot }}</span>
        </div>
      </section>

      <!-- 瓶類型（弓）— only show if not "無" -->
      <section v-if="weapon.bottleType && weapon.bottleType !== '無'" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">瓶類型</h2>
        <div class="p-3 rounded-lg bg-card border border-border text-sm text-foreground">{{ weapon.bottleType }}</div>
      </section>

      <!-- 瓶類型（斬擊斧/充能斧） -->
      <section v-if="weapon.phial" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">瓶類型</h2>
        <div class="p-3 rounded-lg bg-card border border-border">
          <p class="text-sm font-medium text-foreground">{{ weapon.phial.name }}</p>
          <p v-if="weapon.phial.description" class="text-xs text-muted-foreground mt-1">{{ weapon.phial.description }}</p>
        </div>
      </section>

      <!-- 砲擊類型（銃槍） -->
      <section v-if="weapon.shellingType" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">砲擊類型</h2>
        <div class="p-3 rounded-lg bg-card border border-border">
          <p class="text-sm font-medium text-foreground">{{ weapon.shellingType.name }}</p>
          <p v-if="weapon.shellingType.description" class="text-xs text-muted-foreground mt-1">{{ weapon.shellingType.description }}</p>
        </div>
      </section>

      <!-- 旋律效果（狩獵笛） -->
      <section v-if="weapon.melodies?.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">旋律效果</h2>
        <div class="flex flex-col gap-2">
          <div
            v-for="melody in weapon.melodies"
            :key="melody.name"
            class="p-3 rounded-lg bg-card border border-border"
          >
            <p class="text-sm font-medium text-foreground">{{ melody.name }}</p>
            <p v-if="melody.description" class="text-xs text-muted-foreground mt-1">{{ melody.description }}</p>
          </div>
        </div>
      </section>

      <!-- 獵蟲（操蟲棍） -->
      <section v-if="weapon.kinsect" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">獵蟲：{{ weapon.kinsect.name }}</h2>
        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col p-3 rounded-lg bg-card border border-border">
            <span class="text-[10px] text-muted-foreground">獵蟲類型</span>
            <span class="text-sm font-medium text-foreground mt-0.5">{{ weapon.kinsect.type }}</span>
          </div>
          <div class="flex flex-col p-3 rounded-lg bg-card border border-border">
            <span class="text-[10px] text-muted-foreground">性能類型</span>
            <span class="text-sm font-medium text-foreground mt-0.5">{{ weapon.kinsect.performanceType }}</span>
          </div>
          <div class="flex flex-col p-3 rounded-lg bg-card border border-border">
            <span class="text-[10px] text-muted-foreground">攻擊系統</span>
            <span class="text-sm font-medium text-foreground mt-0.5">{{ weapon.kinsect.attackSystem }}</span>
          </div>
          <div class="flex flex-col p-3 rounded-lg bg-card border border-border">
            <span class="text-[10px] text-muted-foreground">獵蟲加成</span>
            <span class="text-sm font-medium text-foreground mt-0.5">{{ weapon.kinsect.bonus }}</span>
          </div>
        </div>
      </section>

    </template>

    <div v-else class="text-center py-16 text-muted-foreground">找不到此武器</div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
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
const { imageUrl } = useImageUrl()

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

function hideImage(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6">
    <template v-if="weapon">
      <PageHeader
        :title="weapon.name"
        :eyebrow="`${typeName} · Weapon`"
        :back="{ to: `/weapons/${type}`, label: `${typeName}列表` }"
      />

      <!-- Hero: image + stats -->
      <div class="mb-10 flex items-stretch gap-3 sm:gap-4">
        <div class="relative flex size-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_50%_35%,var(--card),var(--secondary))] ring-1 ring-inset ring-border sm:size-36">
          <WeaponTypeIcon :type="type" class="size-10 text-muted-foreground/50" />
          <img
            v-if="weapon.image"
            :src="imageUrl(weapon.image)"
            :alt="weapon.name"
            class="absolute inset-0 size-full object-contain p-2"
            @error="hideImage"
          />
        </div>

        <dl class="flex flex-1 flex-col divide-y divide-border rounded-md border border-border bg-card">
          <div class="flex flex-1 items-center justify-between px-3 sm:px-4">
            <dt class="text-xs text-muted-foreground">攻擊力</dt>
            <dd class="font-num text-2xl font-semibold tabular-nums text-foreground">{{ weapon.attack }}</dd>
          </div>
          <div class="flex flex-1 items-center justify-between px-3 sm:px-4">
            <dt class="text-xs text-muted-foreground">會心率</dt>
            <dd
              class="font-num text-2xl font-semibold tabular-nums"
              :class="weapon.affinity > 0 ? 'text-positive' : weapon.affinity < 0 ? 'text-destructive' : 'text-muted-foreground'"
            >{{ weapon.affinity > 0 ? '+' : '' }}{{ weapon.affinity }}<span class="text-base">%</span></dd>
          </div>
          <div class="flex flex-1 items-center justify-between px-3 sm:px-4">
            <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                v-if="weapon.element"
                class="size-2 rounded-full"
                :style="{ background: `var(--color-element-${weapon.element.type})` }"
                aria-hidden="true"
              />
              {{ weapon.element ? `${elementNames[weapon.element.type] || weapon.element.type}屬性` : '屬性' }}
            </dt>
            <dd v-if="weapon.element" class="font-num text-2xl font-semibold tabular-nums text-foreground">{{ weapon.element.value }}</dd>
            <dd v-else class="text-sm text-muted-foreground">無</dd>
          </div>
        </dl>
      </div>

      <div class="flex flex-col gap-10">
        <!-- SP技能 -->
        <section v-if="weapon.spSkill">
          <SectionHeading title="SP技能" en="Special" />
          <div class="flex items-center gap-3 rounded-md border border-primary/40 bg-accent p-3">
            <span class="cut-corner-sm flex-shrink-0 bg-primary px-2 py-1 font-num text-xs font-bold tracking-wider text-primary-foreground">SP</span>
            <span class="text-sm font-medium text-foreground">{{ weapon.spSkill.replace('【SP】', '') }}</span>
          </div>
        </section>

        <!-- 裝備技能 -->
        <section v-if="weapon.skills.length">
          <SectionHeading title="裝備技能" en="Skills" />
          <ul class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            <li v-for="skill in weapon.skills" :key="skill.skillId">
              <NuxtLink
                :to="`/skills/${skill.skillId}`"
                class="group flex min-h-12 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/70 sm:px-4"
              >
                <span class="flex-1 text-sm font-medium text-foreground">{{ skillStore.getById(skill.skillId)?.name || skill.skillId }}</span>
                <span class="font-num tabular-nums text-foreground">
                  <span class="text-[0.6875rem] font-medium text-muted-foreground">Lv</span>
                  <span class="text-lg font-semibold">{{ skill.level }}</span>
                </span>
                <ChevronRight class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- 彈藥種類（輕/重弩） -->
        <section v-if="weapon.ammo?.length">
          <SectionHeading title="彈藥種類" en="Ammo" />
          <div class="overflow-hidden rounded-md border border-border bg-card">
            <table class="w-full text-sm">
              <thead class="border-b border-border bg-secondary/60">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-[0.6875rem] font-medium text-muted-foreground">名稱</th>
                  <th scope="col" class="px-2 py-2 text-center text-[0.6875rem] font-medium text-muted-foreground">裝填數</th>
                  <th scope="col" class="px-2 py-2 text-center text-[0.6875rem] font-medium text-muted-foreground">後座力</th>
                  <th scope="col" class="px-2 py-2 text-center text-[0.6875rem] font-medium text-muted-foreground">填彈</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="ammo in weapon.ammo" :key="ammo.name">
                  <td class="px-3 py-2.5 font-medium text-foreground">{{ ammo.name }}</td>
                  <td class="px-2 py-2.5 text-center font-num text-base font-semibold tabular-nums text-foreground">{{ ammo.capacity }}</td>
                  <td class="px-2 py-2.5 text-center text-foreground">{{ ammo.recoil }}</td>
                  <td class="px-2 py-2.5 text-center text-foreground">{{ ammo.reload }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 蓄力射擊（弓） -->
        <section v-if="weapon.chargingShots?.length">
          <SectionHeading title="蓄力射擊" en="Charge Shots" />
          <ol class="flex flex-wrap gap-2">
            <li
              v-for="(shot, i) in weapon.chargingShots"
              :key="shot"
              class="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-card pl-2 pr-3 text-sm text-foreground"
            >
              <span class="font-num text-xs font-semibold tabular-nums text-primary">{{ i + 1 }}</span>
              {{ shot }}
            </li>
          </ol>
        </section>

        <!-- 瓶類型（弓）— only show if not "無" -->
        <section v-if="weapon.bottleType && weapon.bottleType !== '無'">
          <SectionHeading title="瓶類型" en="Coating" />
          <div class="rounded-md border border-border bg-card p-3 text-sm text-foreground">{{ weapon.bottleType }}</div>
        </section>

        <!-- 瓶類型（斬擊斧/充能斧） -->
        <section v-if="weapon.phial">
          <SectionHeading title="瓶類型" en="Phial" />
          <div class="rounded-md border border-border bg-card p-3 sm:p-4">
            <p class="text-sm font-bold text-foreground">{{ weapon.phial.name }}</p>
            <p v-if="weapon.phial.description" class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ weapon.phial.description }}</p>
          </div>
        </section>

        <!-- 砲擊類型（銃槍） -->
        <section v-if="weapon.shellingType">
          <SectionHeading title="砲擊類型" en="Shelling" />
          <div class="rounded-md border border-border bg-card p-3 sm:p-4">
            <p class="text-sm font-bold text-foreground">{{ weapon.shellingType.name }}</p>
            <p v-if="weapon.shellingType.description" class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ weapon.shellingType.description }}</p>
          </div>
        </section>

        <!-- 旋律效果（狩獵笛） -->
        <section v-if="weapon.melodies?.length">
          <SectionHeading title="旋律效果" en="Melodies" />
          <ul class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            <li v-for="melody in weapon.melodies" :key="melody.name" class="p-3 sm:px-4">
              <p class="text-sm font-bold text-foreground">{{ melody.name }}</p>
              <p v-if="melody.description" class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ melody.description }}</p>
            </li>
          </ul>
        </section>

        <!-- 獵蟲（操蟲棍） -->
        <section v-if="weapon.kinsect">
          <SectionHeading :title="`獵蟲：${weapon.kinsect.name}`" en="Kinsect" />
          <dl class="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
            <div class="bg-card p-3">
              <dt class="text-[0.6875rem] text-muted-foreground">獵蟲類型</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ weapon.kinsect.type }}</dd>
            </div>
            <div class="bg-card p-3">
              <dt class="text-[0.6875rem] text-muted-foreground">性能類型</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ weapon.kinsect.performanceType }}</dd>
            </div>
            <div class="bg-card p-3">
              <dt class="text-[0.6875rem] text-muted-foreground">攻擊系統</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ weapon.kinsect.attackSystem }}</dd>
            </div>
            <div class="bg-card p-3">
              <dt class="text-[0.6875rem] text-muted-foreground">獵蟲加成</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ weapon.kinsect.bonus }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </template>

    <div v-else class="py-24 text-center">
      <p class="text-sm text-muted-foreground">找不到此武器</p>
      <NuxtLink :to="`/weapons/${type}`" class="mt-3 inline-flex h-11 items-center text-sm font-medium text-primary">返回{{ typeName }}列表</NuxtLink>
    </div>
  </div>
</template>

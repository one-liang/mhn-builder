<script setup lang="ts">
import { useSkillStore } from '~/stores/skill'
import { useEquipmentStore, getWeaponTypeName, getPartName } from '~/stores/equipment'
const route = useRoute()
const slug = route.params.slug as string

const skillStore = useSkillStore()
const equipmentStore = useEquipmentStore()

await Promise.all([skillStore.load(), equipmentStore.load()])

const skill = computed(() => skillStore.getById(slug))

useSeoMeta({
  title: () => skill.value ? `${skill.value.name} | 最強獵人 - MHN 配裝模擬器` : '技能詳情 | 最強獵人',
  description: () => skill.value ? `${skill.value.name} - ${skill.value.description}，最高 Lv${skill.value.maxLevel}。` : '',
  ogTitle: () => skill.value ? `${skill.value.name} | 最強獵人` : '',
  ogDescription: () => skill.value ? `${skill.value.description}` : '',
})

const categoryNames: Record<string, string> = {
  attack: '攻擊', element: '屬性', defense: '防禦', resistance: '耐性', utility: '輔助',
}

const armorWithSkill = computed(() => {
  if (!skill.value) return []
  return equipmentStore.allArmor.filter(a =>
    a.skills.some(s => s.skillId === slug)
  ).map(a => ({
    ...a,
    skillLevel: a.skills.find(s => s.skillId === slug)!.level,
  }))
})

const weaponsWithSkill = computed(() => {
  if (!skill.value) return []
  const result: Array<{ weapon: typeof equipmentStore.allArmor[0] extends never ? never : any; type: string; skillLevel: number }> = []
  for (const type of ['great-sword', 'long-sword', 'sword-and-shield', 'hammer', 'bow', 'light-bowgun']) {
    for (const w of equipmentStore.getWeaponsByType(type)) {
      const matched = w.skills.find(s => s.skillId === slug)
      if (matched) {
        result.push({ weapon: w, type, skillLevel: matched.level })
      }
    }
  }
  return result
})

</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <NuxtLink to="/skills" class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      返回技能列表
    </NuxtLink>

    <template v-if="skill">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
            {{ categoryNames[skill.category] || skill.category }}
          </span>
          <span class="text-xs text-muted-foreground">最高 Lv{{ skill.maxLevel }}</span>
        </div>
        <h1 class="text-lg font-bold text-foreground">{{ skill.name }}</h1>
        <p class="text-sm text-muted-foreground mt-2">{{ skill.description }}</p>
      </div>

      <!-- Level Effects -->
      <section class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">等級效果</h2>
        <div class="bg-card rounded-lg border border-border divide-y divide-border">
          <div
            v-for="lv in skill.levels"
            :key="lv.level"
            class="flex items-start gap-3 px-3 py-2"
          >
            <span class="text-xs font-bold text-primary flex-shrink-0 mt-0.5">Lv{{ lv.level }}</span>
            <span class="text-sm text-foreground">{{ lv.effect }}</span>
          </div>
        </div>
      </section>

      <!-- Armor with this skill -->
      <section v-if="armorWithSkill.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">擁有此技能的防具</h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="a in armorWithSkill"
            :key="a.id"
            :to="`/armor/${a.id}`"
            class="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm text-foreground">{{ a.name }}</span>
              <span class="text-xs text-muted-foreground ml-2">{{ a.setName }} | {{ getPartName(a.part) }}</span>
            </div>
            <SkillBadge :name="skill.name" :level="a.skillLevel" />
          </NuxtLink>
        </div>
      </section>

      <!-- Weapons with this skill -->
      <section v-if="weaponsWithSkill.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">擁有此技能的武器</h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="w in weaponsWithSkill"
            :key="w.weapon.id"
            :to="`/weapons/${w.type}/${w.weapon.id}`"
            class="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm text-foreground">{{ w.weapon.name }}</span>
              <span class="text-xs text-muted-foreground ml-2">{{ getWeaponTypeName(w.type) }}</span>
            </div>
            <SkillBadge :name="skill.name" :level="w.skillLevel" />
          </NuxtLink>
        </div>
      </section>

    </template>

    <div v-else class="text-center py-16 text-muted-foreground">找不到此技能</div>
  </div>
</template>

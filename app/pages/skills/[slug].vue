<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
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
  <div class="mx-auto max-w-2xl px-4 sm:px-6">
    <template v-if="skill">
      <PageHeader
        :title="skill.name"
        :eyebrow="skill.nameEn || 'Skill'"
        :back="{ to: '/skills', label: '技能列表' }"
      >
        <div class="mt-3 flex items-center gap-2">
          <span class="rounded-sm bg-secondary px-2 py-1 text-[0.6875rem] font-medium text-secondary-foreground">
            {{ categoryNames[skill.category] || skill.category }}
          </span>
          <span class="font-num text-xs font-semibold tabular-nums text-muted-foreground">MAX Lv{{ skill.maxLevel }}</span>
        </div>
        <p class="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">{{ skill.description }}</p>
      </PageHeader>

      <div class="flex flex-col gap-10">
        <!-- Level Effects -->
        <section>
          <SectionHeading title="等級效果" en="Levels" />
          <ol class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            <li
              v-for="lv in skill.levels"
              :key="lv.level"
              class="flex items-start gap-4 px-3 py-3 sm:px-4"
            >
              <div class="flex w-14 flex-shrink-0 flex-col gap-1.5 pt-0.5">
                <span class="font-num text-lg font-semibold leading-none tabular-nums text-primary">
                  <span class="text-[0.6875rem] font-medium text-muted-foreground">Lv</span>{{ lv.level }}
                </span>
                <span class="flex gap-[2px]" aria-hidden="true">
                  <span
                    v-for="i in skill.maxLevel"
                    :key="i"
                    class="h-1 flex-1 -skew-x-[18deg]"
                    :class="i <= lv.level ? 'bg-primary' : 'bg-border'"
                  />
                </span>
              </div>
              <span class="text-sm leading-relaxed text-foreground">{{ lv.effect }}</span>
            </li>
          </ol>
        </section>

        <!-- Armor with this skill -->
        <section v-if="armorWithSkill.length">
          <SectionHeading title="擁有此技能的防具" en="Armor">
            <span class="font-num text-sm tabular-nums text-muted-foreground">{{ armorWithSkill.length }}</span>
          </SectionHeading>
          <ul class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            <li v-for="a in armorWithSkill" :key="a.id">
              <NuxtLink
                :to="`/armor/${a.id}`"
                class="group flex min-h-12 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/70 sm:px-4"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-foreground">{{ a.name }}</p>
                  <p class="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                    {{ a.setName && a.setName !== '無' ? `${a.setName} · ` : '' }}{{ getPartName(a.part) }}
                  </p>
                </div>
                <span class="font-num tabular-nums text-foreground">
                  <span class="text-[0.6875rem] font-medium text-muted-foreground">Lv</span>
                  <span class="text-lg font-semibold">{{ a.skillLevel }}</span>
                </span>
                <ChevronRight class="size-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Weapons with this skill -->
        <section v-if="weaponsWithSkill.length">
          <SectionHeading title="擁有此技能的武器" en="Weapons">
            <span class="font-num text-sm tabular-nums text-muted-foreground">{{ weaponsWithSkill.length }}</span>
          </SectionHeading>
          <ul class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            <li v-for="w in weaponsWithSkill" :key="w.weapon.id">
              <NuxtLink
                :to="`/weapons/${w.type}/${w.weapon.id}`"
                class="group flex min-h-12 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/70 sm:px-4"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-foreground">{{ w.weapon.name }}</p>
                  <p class="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">{{ getWeaponTypeName(w.type) }}</p>
                </div>
                <span class="font-num tabular-nums text-foreground">
                  <span class="text-[0.6875rem] font-medium text-muted-foreground">Lv</span>
                  <span class="text-lg font-semibold">{{ w.skillLevel }}</span>
                </span>
                <ChevronRight class="size-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <div v-else class="py-24 text-center">
      <p class="text-sm text-muted-foreground">找不到此技能</p>
      <NuxtLink to="/skills" class="mt-3 inline-flex h-11 items-center text-sm font-medium text-primary">返回技能列表</NuxtLink>
    </div>
  </div>
</template>

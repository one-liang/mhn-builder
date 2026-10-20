<script setup lang="ts">
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'
import { useSkillStore } from '~/stores/skill'
import { useEquipmentStore, getWeaponTypeName, getPartName } from '~/stores/equipment'
import driftstoneData from '../../../data/driftstone-skills.json'

const route = useRoute()
const slug = route.params.slug as string

const skillStore = useSkillStore()
const equipmentStore = useEquipmentStore()
const { imageUrl } = useImageUrl()
const colorOf = useSkillColor()

await Promise.all([skillStore.load(), equipmentStore.load()])

const skill = computed(() => skillStore.getById(slug))

useSeoMeta({
  title: () => skill.value ? `${skill.value.name} | 最強獵人 - MHN 配裝模擬器` : '技能詳情 | 最強獵人',
  description: () => skill.value ? `${skill.value.name} - ${skill.value.description}，最高 Lv${skill.value.maxLevel}。` : '',
  ogTitle: () => skill.value ? `${skill.value.name} | 最強獵人` : '',
  ogDescription: () => skill.value ? `${skill.value.description}` : '',
})

const categoryNames: Record<string, string> = {
  attack: '攻擊', element: '屬性', defense: '防禦', resistance: '耐性', utility: '動作',
  'defense-resistance': '防禦耐性',
}

const viaDriftstone = driftstoneData.achievableSkillIds.includes(slug)

const armorWithSkill = computed(() => {
  if (!skill.value) return []
  return equipmentStore.allArmor
    .filter(a => a.skills.some(s => s.skillId === slug))
    .map(a => ({ ...a, skillLevel: a.skills.find(s => s.skillId === slug)!.level }))
    .sort((a, b) => b.skillLevel - a.skillLevel)
})

const weaponsWithSkill = computed(() => {
  if (!skill.value) return []
  return Object.values(equipmentStore.weapons)
    .flat()
    .filter(w => w.skills.some(s => s.skillId === slug))
    .map(w => ({ weapon: w, skillLevel: w.skills.find(s => s.skillId === slug)!.level }))
    .sort((a, b) => b.skillLevel - a.skillLevel)
})
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-10">
    <div class="px-4 md:px-0 pt-4 md:pt-6">
      <NuxtLink
        to="/skills"
        class="inline-flex items-center gap-1.5 h-10 -ml-3 pl-3 pr-4 rounded-full text-[14px] font-medium text-ink-2 hover:text-ink hover:bg-inset"
      >
        <ArrowLeft :size="16" :stroke-width="2.25" aria-hidden="true" />
        所有技能
      </NuxtLink>
    </div>

    <template v-if="skill">
      <header class="flex items-start gap-4 px-4 md:px-0 pt-3 pb-6">
        <img :src="imageUrl('/images/skills/skill.png')" alt="" width="56" height="56" class="size-14 flex-shrink-0" />
        <div class="min-w-0">
          <h1 class="text-[32px] md:text-[40px] leading-[1.1] font-black">{{ skill.name }}</h1>
          <p class="mt-1.5 text-[14px] text-ink-2">
            {{ categoryNames[skill.category] || skill.category }}
            <span class="mx-1.5 text-rule-strong" aria-hidden="true">|</span>
            最高 <span class="stamp text-[15px] font-bold text-ink">Lv{{ skill.maxLevel }}</span>
            <template v-if="viaDriftstone">
              <span class="mx-1.5 text-rule-strong" aria-hidden="true">|</span>
              <NuxtLink to="/skills?tab=driftstones" class="underline underline-offset-4 decoration-rule-strong hover:text-ink">可用漂流石取得</NuxtLink>
            </template>
          </p>
          <p class="mt-2 text-[15px] max-w-[60ch]">{{ skill.description }}</p>
        </div>
      </header>

      <section>
        <h2 class="mx-4 md:mx-0 pb-3 text-[22px] font-black">各等級效果</h2>
        <ol class="card mx-4 md:mx-0 overflow-hidden divide-y divide-rule">
          <li
            v-for="lv in skill.levels"
            :key="lv.level"
            class="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 px-4 py-3"
          >
            <span class="stamp text-[20px] font-extrabold leading-none pt-0.5">Lv{{ lv.level }}</span>
            <div class="min-w-0">
              <TemperBar :total="lv.level" :max="skill.maxLevel" size="sm" :color="colorOf(skill.id)" />
              <p class="mt-1.5 text-[15px] leading-relaxed max-w-[60ch]">{{ lv.effect }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section v-if="armorWithSkill.length" class="mt-8">
        <h2 class="mx-4 md:mx-0 pb-3 text-[22px] font-black">
          有此技能的防具
          <span class="stamp text-[18px] text-ink-2 font-bold ml-1.5">{{ armorWithSkill.length }}</span>
        </h2>
        <ul class="card mx-4 md:mx-0 overflow-hidden divide-y divide-rule">
          <li v-for="a in armorWithSkill" :key="a.id">
            <NuxtLink
              :to="`/armor/${a.id}`"
              class="flex items-center gap-3 px-4 min-h-[60px] py-1.5 hover:bg-inset"
            >
              <span class="flex items-center justify-center size-11 flex-shrink-0 rounded-[12px] bg-ground overflow-hidden">
                <img :src="imageUrl(a.image)" :alt="a.name" width="44" height="44" class="size-full object-contain" loading="lazy" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[15px] font-bold truncate">{{ a.name }}</span>
                <span class="block text-[12px] text-ink-2">{{ [a.setName, getPartName(a.part)].filter(Boolean).join('・') }}</span>
              </span>
              <span class="stamp text-[18px] font-bold">Lv{{ a.skillLevel }}</span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section v-if="weaponsWithSkill.length" class="mt-8">
        <h2 class="mx-4 md:mx-0 pb-3 text-[22px] font-black">
          有此技能的武器
          <span class="stamp text-[18px] text-ink-2 font-bold ml-1.5">{{ weaponsWithSkill.length }}</span>
        </h2>
        <ul class="card mx-4 md:mx-0 overflow-hidden divide-y divide-rule">
          <li v-for="w in weaponsWithSkill" :key="w.weapon.id">
            <NuxtLink
              :to="`/weapons/${w.weapon.type}/${w.weapon.id}`"
              class="flex items-center gap-3 px-4 min-h-[60px] py-1.5 hover:bg-inset"
            >
              <span class="flex items-center justify-center size-11 flex-shrink-0 rounded-[12px] bg-ground overflow-hidden">
                <img :src="imageUrl(w.weapon.image)" :alt="w.weapon.name" width="44" height="44" class="size-full object-contain" loading="lazy" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[15px] font-bold truncate">{{ w.weapon.name }}</span>
                <span class="flex items-center gap-1 text-[12px] text-ink-2">
                  <WeaponTypeIcon :type="w.weapon.type" class="size-3.5" aria-hidden="true" />{{ getWeaponTypeName(w.weapon.type) }}
                </span>
              </span>
              <span class="stamp text-[18px] font-bold">Lv{{ w.skillLevel }}</span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="card mx-4 md:mx-0 mt-6 px-4 py-16 text-center">
      <p class="text-[16px] font-bold">找不到這項技能</p>
      <NuxtLink to="/skills" class="btn btn-secondary btn-sm mt-4">回到技能列表</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronRight, Gem } from 'lucide-vue-next'
import { useEquipmentStore, getPartName, getMonsterIconKey, getArmorSetPrefix } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'

const route = useRoute()
const slug = route.params.slug as string

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()

await Promise.all([equipmentStore.load(), skillStore.load()])

const armor = computed(() => equipmentStore.getArmorById(slug))
const { imageUrl } = useImageUrl()

const setPieces = computed(() => {
  if (!armor.value) return []
  const prefix = getArmorSetPrefix(armor.value.id)
  return equipmentStore.allArmor.filter(a => a.id !== armor.value!.id && getArmorSetPrefix(a.id) === prefix)
})

useSeoMeta({
  title: () => armor.value ? `${armor.value.name} | 最強獵人 - MHN 配裝模擬器` : '防具詳情 | 最強獵人',
  description: () => armor.value ? `${armor.value.name} - ${armor.value.setName}套裝 ${getPartName(armor.value.part)}，防禦力 ${armor.value.defense}。` : '',
  ogTitle: () => armor.value ? `${armor.value.name} | 最強獵人` : '',
  ogDescription: () => armor.value ? `${armor.value.setName}套裝 ${getPartName(armor.value.part)}，防禦 ${armor.value.defense}` : '',
})
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-10">
    <div class="px-4 md:px-0 pt-4">
      <NuxtLink
        to="/armor"
        class="inline-flex items-center gap-1 h-11 -ml-1 pr-2 text-[13px] text-ink-2 hover:text-ink transition-colors duration-150"
      >
        <ArrowLeft :size="16" :stroke-width="2" aria-hidden="true" />
        所有防具
      </NuxtLink>
    </div>

    <template v-if="armor">
      <header class="flex items-center gap-4 px-4 md:px-0 pt-2 pb-5">
        <span class="plate flex items-center justify-center size-24 flex-shrink-0 overflow-hidden">
          <img
            v-if="armor.image"
            :src="imageUrl(armor.image)"
            :alt="armor.name"
            width="96"
            height="96"
            class="size-full object-contain"
            @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
          />
          <ArmorPartIcon v-else :part="armor.part" class="size-10 text-ink-2" />
        </span>
        <div class="min-w-0">
          <h1 class="text-[24px] leading-tight font-black tracking-[0.03em]">{{ armor.name }}</h1>
          <p class="mt-1 flex items-center gap-1.5 text-[13px] text-ink-2">
            <img
              v-if="getMonsterIconKey(armor.id)"
              :src="imageUrl(`/images/monsters/${getMonsterIconKey(armor.id)}.webp`)"
              alt=""
              width="16"
              height="16"
              class="size-4 object-contain"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            {{ [armor.setName, getPartName(armor.part)].filter(Boolean).join('・') }}
          </p>
        </div>
      </header>

      <dl class="grid grid-cols-2 bg-panel border-y md:border md:rounded-md border-rule divide-x divide-rule">
        <div class="px-4 py-3">
          <dt class="text-[12px] text-ink-2">防禦力（滿級）</dt>
          <dd class="stamp text-[30px] font-extrabold leading-none mt-1">{{ armor.defense }}</dd>
        </div>
        <div class="px-4 py-3">
          <dt class="text-[12px] text-ink-2">漂流石槽</dt>
          <dd class="flex items-center gap-2 mt-1">
            <span class="stamp text-[30px] font-extrabold leading-none">{{ armor.driftstoneSlots }}</span>
            <span v-if="armor.driftstoneSlots" class="flex gap-1" aria-hidden="true">
              <span
                v-for="i in armor.driftstoneSlots"
                :key="i"
                class="flex items-center justify-center size-7 rounded-sm border border-rule-strong bg-inset text-ink-2"
              ><Gem :size="14" :stroke-width="2" /></span>
            </span>
          </dd>
        </div>
      </dl>

      <section v-if="armor.skills.length" class="mt-7">
        <h2 class="mx-4 md:mx-0 pb-2 border-b-2 border-ink text-[15px] font-bold">技能</h2>
        <ul class="divide-y divide-rule border-b border-rule">
          <li v-for="skill in armor.skills" :key="skill.skillId">
            <NuxtLink
              :to="`/skills/${skill.skillId}`"
              class="grid grid-cols-[minmax(0,1fr)_auto_3rem_1rem] items-center gap-3 px-4 md:px-2 min-h-[52px] hover:bg-inset transition-colors duration-150"
            >
              <span class="text-[15px] font-medium truncate">{{ skillStore.getById(skill.skillId)?.name || skill.skillId }}</span>
              <TemperBar :total="skill.level" :max="skillStore.getById(skill.skillId)?.maxLevel ?? skill.level" />
              <span class="stamp text-[18px] font-bold text-right">Lv{{ skill.level }}</span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section v-if="setPieces.length" class="mt-7">
        <h2 class="mx-4 md:mx-0 pb-2 border-b-2 border-ink text-[15px] font-bold">同套裝的其他部位</h2>
        <ul class="divide-y divide-rule border-b border-rule">
          <li v-for="piece in setPieces" :key="piece.id">
            <NuxtLink
              :to="`/armor/${piece.id}`"
              class="flex items-center gap-3 px-4 md:px-2 min-h-[56px] py-1.5 hover:bg-inset transition-colors duration-150"
            >
              <span class="plate flex items-center justify-center size-10 flex-shrink-0 overflow-hidden">
                <img :src="imageUrl(piece.image)" :alt="piece.name" width="40" height="40" class="size-full object-contain" loading="lazy" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[12px] text-ink-2">{{ getPartName(piece.part) }}</span>
                <span class="block text-[15px] font-medium truncate">{{ piece.name }}</span>
              </span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="px-4 py-16 text-center">
      <p class="text-[16px] font-bold">找不到這件防具</p>
      <NuxtLink to="/armor" class="inline-block mt-2 text-[14px] underline underline-offset-4">回到防具列表</NuxtLink>
    </div>
  </div>
</template>

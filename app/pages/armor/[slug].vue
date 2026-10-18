<script setup lang="ts">
import { ChevronRight, Gem } from 'lucide-vue-next'
import { useEquipmentStore, getPartName, getMonsterIconKey } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'

const route = useRoute()
const slug = route.params.slug as string

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()

await Promise.all([equipmentStore.load(), skillStore.load()])

const armor = computed(() => equipmentStore.getArmorById(slug))
const { imageUrl } = useImageUrl()

useSeoMeta({
  title: () => armor.value ? `${armor.value.name} | 最強獵人 - MHN 配裝模擬器` : '防具詳情 | 最強獵人',
  description: () => armor.value ? `${armor.value.name} - ${armor.value.setName}套裝 ${getPartName(armor.value.part)}，防禦力 ${armor.value.defense}。` : '',
  ogTitle: () => armor.value ? `${armor.value.name} | 最強獵人` : '',
  ogDescription: () => armor.value ? `${armor.value.setName}套裝 ${getPartName(armor.value.part)}，防禦 ${armor.value.defense}` : '',
})

const hasSet = computed(() => !!armor.value?.setName && armor.value.setName !== '無')

function hideImage(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6">
    <template v-if="armor">
      <PageHeader
        :title="armor.name"
        :eyebrow="`${getPartName(armor.part)} · Armor`"
        :back="{ to: '/armor', label: '防具列表' }"
      />

      <!-- Hero: image + stats -->
      <div class="mb-10 flex items-stretch gap-3 sm:gap-4">
        <div class="relative flex size-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_50%_35%,var(--card),var(--secondary))] ring-1 ring-inset ring-border sm:size-36">
          <ArmorPartIcon :part="armor.part" class="size-10 text-muted-foreground/50" />
          <img
            v-if="armor.image"
            :src="imageUrl(armor.image)"
            :alt="armor.name"
            class="absolute inset-0 size-full object-contain p-2"
            @error="hideImage"
          />
        </div>

        <dl class="flex flex-1 flex-col divide-y divide-border rounded-md border border-border bg-card">
          <div class="flex flex-1 items-center justify-between px-3 sm:px-4">
            <dt class="text-xs text-muted-foreground">防禦力 <span class="text-[0.625rem]">（滿級）</span></dt>
            <dd class="font-num text-2xl font-semibold tabular-nums text-foreground">{{ armor.defense }}</dd>
          </div>
          <div class="flex flex-1 items-center justify-between px-3 sm:px-4">
            <dt class="text-xs text-muted-foreground">漂移鑲嵌槽</dt>
            <dd class="flex items-center gap-1">
              <template v-if="armor.driftstoneSlots > 0">
                <Gem
                  v-for="i in armor.driftstoneSlots"
                  :key="i"
                  class="size-4 text-stone"
                  aria-hidden="true"
                />
                <span class="ml-1 font-num text-2xl font-semibold tabular-nums text-foreground">{{ armor.driftstoneSlots }}</span>
              </template>
              <span v-else class="text-sm text-muted-foreground">無</span>
            </dd>
          </div>
          <div class="flex flex-1 items-center justify-between gap-3 px-3 sm:px-4">
            <dt class="text-xs text-muted-foreground">系列</dt>
            <dd class="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
              <img
                v-if="getMonsterIconKey(armor.id)"
                :src="imageUrl(`/images/monsters/${getMonsterIconKey(armor.id)}.webp`)"
                class="size-5 flex-shrink-0 object-contain"
                alt=""
                @error="hideImage"
              />
              <span class="truncate">{{ hasSet ? armor.setName : '—' }}</span>
            </dd>
          </div>
        </dl>
      </div>

      <!-- Skills -->
      <section v-if="armor.skills.length">
        <SectionHeading title="技能" en="Skills" />
        <ul class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
          <li v-for="skill in armor.skills" :key="skill.skillId">
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
    </template>

    <div v-else class="py-24 text-center">
      <p class="text-sm text-muted-foreground">找不到此防具</p>
      <NuxtLink to="/armor" class="mt-3 inline-flex h-11 items-center text-sm font-medium text-primary">返回防具列表</NuxtLink>
    </div>
  </div>
</template>

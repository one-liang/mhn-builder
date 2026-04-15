<script setup lang="ts">
import { useEquipmentStore, getPartName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'

const route = useRoute()
const slug = route.params.slug as string

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()

await Promise.all([equipmentStore.load(), skillStore.load()])

const armor = computed(() => equipmentStore.getArmorById(slug))

useSeoMeta({
  title: () => armor.value ? `${armor.value.name} | 最強獵人 - MHN 配裝模擬器` : '防具詳情 | 最強獵人',
  description: () => armor.value ? `${armor.value.name} - ${armor.value.setName}套裝 ${getPartName(armor.value.part)}，防禦力 ${armor.value.defense}。` : '',
  ogTitle: () => armor.value ? `${armor.value.name} | 最強獵人` : '',
  ogDescription: () => armor.value ? `${armor.value.setName}套裝 ${getPartName(armor.value.part)}，防禦 ${armor.value.defense}` : '',
})
</script>

<template>
  <div class="px-4 py-4 max-w-lg mx-auto">
    <NuxtLink to="/armor" class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      返回防具列表
    </NuxtLink>

    <template v-if="armor">
      <!-- Header -->
      <div class="flex items-start gap-4 mb-6">
        <div class="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <img v-if="armor.image" :src="armor.image" :alt="armor.name" class="w-full h-full object-cover rounded-lg" @error="($event.target as HTMLImageElement).style.display = 'none'" />
          <ArmorPartIcon v-else :part="armor.part" class="w-10 h-10 text-primary/80" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-foreground">{{ armor.name }}</h1>
          <p class="text-xs text-muted-foreground mt-1">{{ armor.setName }} | {{ getPartName(armor.part) }}</p>
        </div>
      </div>

      <!-- Defense -->
      <section class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">防禦力</h2>
        <div class="bg-card rounded-lg p-3 border border-border">
          <span class="text-2xl font-bold text-foreground">{{ armor.defense }}</span>
          <span class="text-xs text-muted-foreground ml-1">（滿級）</span>
        </div>
      </section>

      <!-- Skills -->
      <section v-if="armor.skills.length" class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">技能</h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="skill in armor.skills"
            :key="skill.skillId"
            :to="`/skills/${skill.skillId}`"
            class="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <span class="text-sm text-foreground">{{ skillStore.getById(skill.skillId)?.name || skill.skillId }}</span>
            <SkillBadge :name="skillStore.getById(skill.skillId)?.name || skill.skillId" :level="skill.level" />
          </NuxtLink>
        </div>
      </section>

      <!-- Driftstone Slots -->
      <section class="mb-4">
        <h2 class="text-sm font-semibold text-primary mb-2">漂移鑲嵌槽</h2>
        <div class="bg-card rounded-lg p-3 border border-border flex items-center gap-2">
          <template v-if="armor.driftstoneSlots > 0">
            <div class="flex gap-1.5">
              <div
                v-for="i in armor.driftstoneSlots"
                :key="i"
                class="w-5 h-5 rounded-full bg-primary/20 border-2 border-primary/60 flex items-center justify-center"
              >
                <div class="w-2 h-2 rounded-full bg-primary/80" />
              </div>
            </div>
            <span class="text-sm text-foreground">{{ armor.driftstoneSlots }} 個插槽</span>
          </template>
          <span v-else class="text-sm text-muted-foreground">無</span>
        </div>
      </section>
    </template>

    <div v-else class="text-center py-16 text-muted-foreground">
      找不到此防具
    </div>
  </div>
</template>

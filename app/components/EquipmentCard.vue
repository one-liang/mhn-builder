<script setup lang="ts">
interface Skill {
  skillId: string
  level: number
  name?: string
}

const { imageUrl } = useImageUrl()

const props = defineProps<{
  id: string
  name: string
  nameEn?: string
  rarity?: number
  skills: Skill[]
  image?: string
  weaponType?: string
  armorPart?: string
  to: string
  subtitle?: string
  monsterIconKey?: string
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors min-h-[44px]"
  >
    <!-- Image / Icon -->
    <div
      class="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md bg-secondary overflow-hidden"
    >
      <img
        v-if="image"
        :src="imageUrl(image)"
        :alt="name"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <WeaponTypeIcon
        v-else-if="weaponType"
        :type="weaponType"
        class="w-7 h-7 text-primary/80"
      />
      <ArmorPartIcon
        v-else-if="armorPart"
        :part="armorPart"
        class="w-7 h-7 text-primary/80"
      />
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <RarityIndicator v-if="rarity" :rarity="rarity" />
        <h3 class="font-semibold text-sm truncate text-foreground">{{ name }}</h3>
      </div>
      <div v-if="monsterIconKey || subtitle" class="flex items-center gap-1 mt-0.5">
        <img
          v-if="monsterIconKey"
          :src="imageUrl(`/images/monsters/${monsterIconKey}.webp`)"
          class="w-4 h-4 rounded-sm flex-shrink-0 object-cover"
          :alt="monsterIconKey"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <p v-if="subtitle" class="text-xs text-muted-foreground">{{ subtitle }}</p>
      </div>
      <div v-if="skills.length" class="flex flex-wrap gap-1 mt-1.5">
        <SkillBadge
          v-for="skill in skills"
          :key="skill.skillId"
          :name="skill.name || skill.skillId"
          :level="skill.level"
        />
      </div>
    </div>

    <!-- Arrow -->
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
  </NuxtLink>
</template>

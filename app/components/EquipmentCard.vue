<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

interface Skill {
  skillId: string
  level: number
  name?: string
}

// One row in an equipment list: art on a steel plate, name, a stat line, skills.
defineProps<{
  id: string
  name: string
  skills: Skill[]
  image?: string
  weaponType?: string
  armorPart?: string
  to: string
  /** Short facts shown as label/value pairs, e.g. [['攻擊', '1200']] */
  stats?: [string, string][]
  setName?: string
  /** Crest of the monster the piece is made from (or a set icon), shown on the art's corner. */
  monsterIcon?: string
  monsterName?: string
}>()

const { imageUrl } = useImageUrl()
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 pl-4 pr-3 py-3 min-h-[76px] transition-colors duration-150 hover:bg-inset"
  >
    <span class="relative plate flex items-center justify-center size-14 flex-shrink-0">
      <img
        v-if="image"
        :src="imageUrl(image)"
        :alt="name"
        width="56"
        height="56"
        class="size-full object-contain"
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
      />
      <WeaponTypeIcon v-else-if="weaponType" :type="weaponType" class="size-7 text-ink-2" />
      <ArmorPartIcon v-else-if="armorPart" :part="armorPart" class="size-7 text-ink-2" />
      <img
        v-if="monsterIcon"
        :src="imageUrl(monsterIcon)"
        :alt="monsterName ?? ''"
        :title="monsterName"
        width="26"
        height="26"
        class="absolute -right-1.5 -bottom-1.5 size-[26px] rounded-full bg-panel border border-rule object-contain p-px"
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
    </span>

    <span class="flex-1 min-w-0">
      <span class="flex items-center gap-1.5 min-w-0">
        <span class="text-[16px] font-bold leading-snug truncate">{{ name }}</span>
      </span>
      <span v-if="stats?.length || setName || monsterName" class="flex flex-wrap items-baseline gap-x-3 text-[12px] text-ink-2 leading-snug">
        <span v-if="setName">{{ setName }}</span>
        <span v-else-if="monsterName">{{ monsterName }}</span>
        <span v-for="[k, v] in stats" :key="k" class="whitespace-nowrap">
          {{ k }} <span class="stamp text-[15px] font-bold text-ink">{{ v }}</span>
        </span>
      </span>
      <span v-if="skills.length" class="flex flex-wrap gap-x-3 text-[13px] text-ink-2 leading-snug mt-0.5">
        <SkillBadge v-for="skill in skills" :key="skill.skillId" :name="skill.name || skill.skillId" :level="skill.level" />
      </span>
    </span>

    <ChevronRight :size="18" :stroke-width="2" class="flex-shrink-0 text-ink-3" aria-hidden="true" />
  </NuxtLink>
</template>

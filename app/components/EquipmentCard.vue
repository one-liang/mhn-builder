<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

interface Skill {
  skillId: string
  level: number
  name?: string
}

interface Stat {
  label: string
  value: string | number
  /** 屬性色點（CSS 顏色值） */
  dot?: string
  tone?: 'positive' | 'negative'
}

const { imageUrl } = useImageUrl()

defineProps<{
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
  stats?: Stat[]
  monsterIconKey?: string
}>()

function hideImage(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex min-h-[44px] items-center gap-3 px-3 py-3 transition-colors hover:bg-secondary/70 sm:px-4"
  >
    <!-- Image / Icon -->
    <div
      class="relative flex size-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_50%_35%,var(--card),var(--secondary))] ring-1 ring-inset ring-border"
    >
      <WeaponTypeIcon
        v-if="weaponType"
        :type="weaponType"
        class="size-6 text-muted-foreground/60"
      />
      <ArmorPartIcon
        v-else-if="armorPart"
        :part="armorPart"
        class="size-6 text-muted-foreground/60"
      />
      <img
        v-if="image"
        :src="imageUrl(image)"
        :alt="name"
        class="absolute inset-0 size-full object-contain p-1"
        loading="lazy"
        @error="hideImage"
      />
    </div>

    <!-- Info -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <RarityIndicator v-if="rarity" :rarity="rarity" />
        <h3 class="truncate text-sm font-bold text-foreground">{{ name }}</h3>
      </div>

      <div v-if="monsterIconKey || subtitle || stats?.length" class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
        <div v-if="monsterIconKey || subtitle" class="flex min-w-0 items-center gap-1.5">
          <img
            v-if="monsterIconKey"
            :src="imageUrl(`/images/monsters/${monsterIconKey}.webp`)"
            class="size-4 flex-shrink-0 object-contain"
            alt=""
            @error="hideImage"
          />
          <p v-if="subtitle" class="truncate text-xs text-muted-foreground">{{ subtitle }}</p>
        </div>
        <dl v-if="stats?.length" class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <div v-for="s in stats" :key="s.label" class="flex items-baseline gap-1">
            <dt class="flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
              <span v-if="s.dot" class="size-1.5 rounded-full" :style="{ background: s.dot }" aria-hidden="true" />
              {{ s.label }}
            </dt>
            <dd
              class="font-num text-sm font-semibold tabular-nums"
              :class="s.tone === 'positive' ? 'text-positive' : s.tone === 'negative' ? 'text-destructive' : 'text-foreground'"
            >{{ s.value }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="skills.length" class="mt-1.5 flex flex-wrap gap-1">
        <SkillBadge
          v-for="skill in skills"
          :key="skill.skillId"
          :name="skill.name || skill.skillId"
          :level="skill.level"
        />
      </div>
    </div>

    <ChevronRight
      class="size-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    />
  </NuxtLink>
</template>

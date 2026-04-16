<script setup lang="ts">
import type { Weapon } from '~/stores/equipment'
import { getPartName } from '~/stores/equipment'
import type { BuildSlot } from '~/stores/build'
import { useSkillStore } from '~/stores/skill'

type SlotItem = Weapon | Armor | null

const props = defineProps<{
  slotType: BuildSlot
  item: SlotItem
}>()

const emit = defineEmits<{
  (e: 'open'): void
}>()

const skillStore = useSkillStore()

const slotLabel = computed(() => {
  if (props.slotType === 'weapon') return '武器'
  return getPartName(props.slotType)
})

const isWeapon = computed(() => props.slotType === 'weapon')

const skillBadges = computed(() => {
  if (!props.item) return []
  return props.item.skills.slice(0, 3).map(s => ({
    id: s.skillId,
    name: skillStore.getById(s.skillId)?.name ?? s.skillId,
    level: s.level,
  }))
})
</script>

<template>
  <button
    class="w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors min-h-[52px] text-left cursor-pointer"
    :class="item
      ? 'bg-card border-border hover:border-primary/60'
      : 'bg-card/40 border-dashed border-border/60 hover:border-primary/40'"
    @click="emit('open')"
  >
    <!-- Icon -->
    <div
      class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md"
      :class="item ? 'bg-secondary text-primary' : 'bg-secondary/40 text-muted-foreground/60'"
    >
      <WeaponTypeIcon
        v-if="isWeapon && item && 'type' in item"
        :type="(item as Weapon).type"
        class="w-6 h-6"
      />
      <ArmorPartIcon
        v-else-if="!isWeapon"
        :part="slotType"
        class="w-6 h-6"
      />
      <!-- Weapon unselected icon -->
      <svg
        v-else-if="isWeapon"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
        <line x1="13" x2="19" y1="19" y2="13" />
        <line x1="16" x2="20" y1="16" y2="20" />
        <line x1="19" x2="21" y1="21" y2="19" />
      </svg>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <template v-if="item">
        <div class="text-sm font-semibold text-foreground truncate">{{ item.name }}</div>
        <div v-if="skillBadges.length" class="flex flex-wrap gap-1 mt-1">
          <span
            v-for="s in skillBadges"
            :key="s.id"
            class="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded bg-primary/10 text-primary/80 border border-primary/20 leading-none"
          >{{ s.name }} Lv{{ s.level }}</span>
        </div>
      </template>
      <template v-else>
        <div class="text-[11px] text-muted-foreground font-medium">{{ slotLabel }}</div>
        <div class="text-sm text-muted-foreground/80 mt-0.5">未選擇</div>
      </template>
    </div>

    <!-- Chevron -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="flex-shrink-0 text-muted-foreground"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </button>
</template>

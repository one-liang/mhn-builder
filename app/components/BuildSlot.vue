<script setup lang="ts">
import { ChevronRight, Plus } from 'lucide-vue-next'
import type { Armor, Weapon } from '~/stores/equipment'
import { getPartName, getWeaponTypeName } from '~/stores/equipment'
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
const { imageUrl } = useImageUrl()

const isWeapon = computed(() => props.slotType === 'weapon')

const slotLabel = computed(() => {
  if (isWeapon.value) return '武器'
  return getPartName(props.slotType)
})

const weaponType = computed(() =>
  isWeapon.value && props.item ? (props.item as Weapon).type : ''
)

const subLabel = computed(() => {
  if (!props.item) return ''
  if (isWeapon.value) return getWeaponTypeName(weaponType.value)
  const setName = (props.item as Armor).setName
  return setName && setName !== '無' ? setName : ''
})

const skillBadges = computed(() => {
  if (!props.item) return []
  return props.item.skills.slice(0, 3).map(s => ({
    id: s.skillId,
    name: skillStore.getById(s.skillId)?.name ?? s.skillId,
    level: s.level,
  }))
})

function hideImage(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <button
    type="button"
    class="group flex min-h-[64px] w-full cursor-pointer items-center gap-3 rounded-md border p-2 pr-3 text-left transition-colors duration-150"
    :class="item
      ? 'border-border bg-card hover:border-border-strong'
      : 'border-dashed border-border-strong bg-transparent hover:border-primary hover:bg-accent/50'"
    :aria-label="item ? `${slotLabel}：${item.name}，點擊更換` : `選擇${slotLabel}`"
    @click="emit('open')"
  >
    <!-- Icon / image tile -->
    <div
      class="relative flex size-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm"
      :class="item
        ? 'bg-[radial-gradient(circle_at_50%_35%,var(--card),var(--secondary))] ring-1 ring-inset ring-border'
        : 'bg-secondary text-muted-foreground'"
    >
      <WeaponTypeIcon
        v-if="isWeapon"
        :type="weaponType || 'sword-and-shield'"
        class="size-6"
        :class="item ? 'text-muted-foreground/50' : ''"
      />
      <ArmorPartIcon
        v-else
        :part="slotType"
        class="size-6"
        :class="item ? 'text-muted-foreground/50' : ''"
      />
      <img
        v-if="item?.image"
        :src="imageUrl(item.image)"
        :alt="item.name"
        class="absolute inset-0 size-full object-contain p-0.5"
        loading="lazy"
        @error="hideImage"
      />
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-1.5 text-[0.6875rem] font-medium leading-none">
        <span :class="item ? 'text-primary' : 'text-muted-foreground'">{{ slotLabel }}</span>
        <template v-if="subLabel">
          <span class="text-border-strong" aria-hidden="true">/</span>
          <span class="truncate text-muted-foreground">{{ subLabel }}</span>
        </template>
      </p>
      <template v-if="item">
        <p class="mt-1 truncate text-sm font-bold leading-snug text-foreground">{{ item.name }}</p>
        <div v-if="skillBadges.length" class="mt-1 flex flex-wrap gap-1">
          <SkillBadge
            v-for="s in skillBadges"
            :key="s.id"
            :name="s.name"
            :level="s.level"
            size="sm"
          />
        </div>
      </template>
      <p v-else class="mt-1.5 text-sm text-muted-foreground">尚未選擇</p>
    </div>

    <ChevronRight
      v-if="item"
      class="size-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    />
    <Plus
      v-else
      class="size-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
      aria-hidden="true"
    />
  </button>
</template>

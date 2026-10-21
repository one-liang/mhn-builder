<script setup lang="ts">
import { Lock, LockOpen, Plus } from 'lucide-vue-next'
import type { Armor, Weapon } from '~/stores/equipment'
import { getPartName, getWeaponTypeName } from '~/stores/equipment'
import type { BuildSlot } from '~/stores/build'
import { useSkillStore } from '~/stores/skill'
import { gearBadge } from '~/lib/monsters'

type SlotItem = Weapon | Armor | null

const props = defineProps<{
  slotType: BuildSlot
  item: SlotItem
  locked: boolean
  /** Skill names in this piece's driftstone slots (null = empty slot). */
  sockets: (string | null)[]
}>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'toggleLock'): void
  (e: 'openSocket', index: number): void
}>()

const skillStore = useSkillStore()
const { imageUrl } = useImageUrl()

const isWeapon = computed(() => props.slotType === 'weapon')
const badge = computed(() => (props.item ? gearBadge(props.item, isWeapon.value ? 'weapon' : 'armor') : null))
const slotLabel = computed(() => (isWeapon.value ? '武器' : getPartName(props.slotType)))

const subLabel = computed(() => {
  if (!props.item) return slotLabel.value
  if (isWeapon.value) return getWeaponTypeName((props.item as Weapon).type)
  return slotLabel.value
})

// Vertical setting: short Latin runs such as "SP" or "UP" sit upright as one unit.
function verticalRuns(name: string) {
  return name.split(/([A-Za-z0-9]{1,3})/).filter(Boolean).map(text => ({
    text,
    combine: /^[A-Za-z0-9]{1,3}$/.test(text),
  }))
}

const skills = computed(() => {
  if (!props.item) return []
  return props.item.skills.map(s => ({
    id: s.skillId,
    name: skillStore.getById(s.skillId)?.name ?? s.skillId,
    level: s.level,
    enhance: 'requiredCustomEnhancementLevel' in s ? s.requiredCustomEnhancementLevel : undefined,
  }))
})
</script>

<template>
  <li class="flex items-stretch min-h-[84px]">
    <button
      type="button"
      class="slot flex-1 min-w-0 flex items-center gap-3 pl-4 pr-2 py-3 text-left hover:bg-inset"
      :aria-label="item ? `${slotLabel}：${item.name}，點擊更換` : `選擇${slotLabel}`"
      @click="emit('open')"
    >
      <span
        class="relative flex items-center justify-center size-14 flex-shrink-0 rounded-[14px]"
        :class="item ? 'bg-ground' : 'border-2 border-dashed border-rule-strong text-ink-3'"
      >
        <img
          v-if="item"
          :src="imageUrl(item.image)"
          :alt="item.name"
          width="56"
          height="56"
          class="size-full object-contain"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
        />
        <img
          v-if="badge"
          :src="imageUrl(badge.icon)"
          :alt="badge.name ?? ''"
          :title="badge.name"
          width="28"
          height="28"
          class="absolute -right-1.5 -bottom-1.5 size-7 rounded-full bg-ground ring-2 ring-panel object-contain p-0.5"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <template v-else-if="!item">
          <WeaponTypeIcon v-if="isWeapon" type="sword-and-shield" class="size-6" aria-hidden="true" />
          <ArmorPartIcon v-else :part="slotType" class="size-6" aria-hidden="true" />
        </template>
      </span>

      <span class="flex-1 min-w-0">
        <span class="flex items-center gap-1.5 text-[12px] font-medium text-ink-2 leading-tight">
          <WeaponTypeIcon v-if="isWeapon && item" :type="(item as Weapon).type" class="size-3.5" aria-hidden="true" />
          <ArmorPartIcon v-else-if="item" :part="slotType" class="size-3.5" aria-hidden="true" />
          {{ subLabel }}
        </span>
        <template v-if="item">
          <span class="block text-[17px] font-bold leading-snug truncate">{{ item.name }}</span>
          <span v-if="skills.length" class="flex flex-wrap gap-x-3 text-[13px] text-ink-2 leading-snug">
            <SkillBadge v-for="s in skills" :key="s.id" :name="s.name" :level="s.level" :enhance="s.enhance" />
          </span>
        </template>
        <span v-else class="block text-[16px] font-medium text-ink-3 leading-snug">點此選擇{{ slotLabel }}</span>
      </span>
    </button>

    <!-- Driftstone sockets: narrow tiles, skill name set vertically -->
    <span v-if="sockets.length" class="flex items-stretch gap-1 py-2.5 pr-1">
      <button
        v-for="(name, i) in sockets"
        :key="i"
        type="button"
        class="socket flex flex-col items-center justify-center gap-0.5 min-w-11 px-1 py-1 rounded-[12px]"
        :class="name
          ? 'bg-shell text-shell-ink hover:bg-shell-raised'
          : 'border-2 border-dashed border-rule-strong text-ink-2 hover:text-ink hover:border-ink-2'"
        :aria-label="`${slotLabel}漂流石槽 ${i + 1}：${name ? `${name} Lv1` : '空'}`"
        :title="name ? `${name} Lv1` : '漂流石槽（空）'"
        @click="emit('openSocket', i)"
      >
        <span v-if="name" class="vertical wrap text-[11.5px] font-bold"><span
          v-for="(run, k) in verticalRuns(name)"
          :key="k"
          :class="run.combine ? 'tcy' : ''"
        >{{ run.text }}</span></span>
        <template v-else>
          <Plus :size="14" :stroke-width="2.5" class="flex-shrink-0" aria-hidden="true" />
          <span class="vertical text-[11px] leading-none whitespace-nowrap">漂流石</span>
        </template>
      </button>
    </span>

    <span class="flex items-center pr-2">
      <button
        type="button"
        class="flex items-center justify-center size-11 rounded-full"
        :class="locked ? 'bg-shell text-shell-ink' : 'text-ink-3 hover:text-ink hover:bg-inset'"
        :aria-pressed="locked"
        :aria-label="locked ? `解除鎖定${slotLabel}` : `鎖定${slotLabel}（自動配裝時不更換）`"
        :title="locked ? '已鎖定：自動配裝不更換' : '鎖定：自動配裝不更換'"
        @click="emit('toggleLock')"
      >
        <Lock v-if="locked" :size="17" :stroke-width="2.25" aria-hidden="true" />
        <LockOpen v-else :size="17" :stroke-width="2" aria-hidden="true" />
      </button>
    </span>
  </li>
</template>

<style scoped>
.vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
/* Long names break into extra columns (4 characters each) instead of being cut. */
.wrap {
  inline-size: 4.3em;
  line-height: 1.08;
  line-break: strict;
}
.tcy {
  text-combine-upright: all;
}
.socket,
.slot {
  transition: transform 160ms var(--ease-out-quint);
}
.socket:active {
  transform: scale(0.94);
}
</style>

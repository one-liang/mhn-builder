<script setup lang="ts">
import { Lock, LockOpen, Plus } from 'lucide-vue-next'
import type { Armor, Weapon } from '~/stores/equipment'
import { getPartName, getWeaponTypeName } from '~/stores/equipment'
import type { BuildSlot } from '~/stores/build'
import { useSkillStore } from '~/stores/skill'

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
  <li class="flex items-stretch min-h-[76px]">
    <button
      type="button"
      class="flex-1 min-w-0 flex items-center gap-3 pl-4 pr-2 py-2.5 text-left transition-colors duration-150 hover:bg-inset"
      :aria-label="item ? `${slotLabel}：${item.name}，點擊更換` : `選擇${slotLabel}`"
      @click="emit('open')"
    >
      <span
        class="relative flex items-center justify-center size-[52px] flex-shrink-0 rounded-md overflow-hidden"
        :class="item ? 'plate' : 'border border-dashed border-rule-strong text-ink-3'"
      >
        <img
          v-if="item"
          :src="imageUrl(item.image)"
          :alt="item.name"
          width="52"
          height="52"
          class="size-full object-contain"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
        />
        <template v-else>
          <WeaponTypeIcon v-if="isWeapon" type="sword-and-shield" class="size-6" aria-hidden="true" />
          <ArmorPartIcon v-else :part="slotType" class="size-6" aria-hidden="true" />
        </template>
        <!-- part glyph tag on equipped art -->
        <span
          v-if="item"
          class="absolute left-0 bottom-0 flex items-center justify-center size-[18px] bg-shell text-shell-ink rounded-tr-[3px]"
          aria-hidden="true"
        >
          <WeaponTypeIcon v-if="isWeapon" :type="(item as Weapon).type" class="size-3" />
          <ArmorPartIcon v-else :part="slotType" class="size-3" />
        </span>
      </span>

      <span class="flex-1 min-w-0">
        <span class="block text-[12px] text-ink-2 leading-tight">{{ subLabel }}</span>
        <template v-if="item">
          <span class="block text-[16px] font-bold leading-snug truncate">{{ item.name }}</span>
          <span v-if="skills.length" class="flex flex-wrap gap-x-2.5 text-[13px] text-ink-2 leading-snug">
            <SkillBadge v-for="s in skills" :key="s.id" :name="s.name" :level="s.level" :enhance="s.enhance" />
          </span>
        </template>
        <span v-else class="block text-[15px] text-ink-3 leading-snug">未裝備・點此選擇</span>
      </span>
    </button>

    <!-- Driftstone sockets: narrow tiles, skill name set vertically -->
    <span v-if="sockets.length" class="flex items-stretch gap-1 py-2 pr-1.5">
      <button
        v-for="(name, i) in sockets"
        :key="i"
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 min-w-11 px-1 py-1 rounded-sm border transition-colors duration-150"
        :class="name
          ? 'bg-shell border-shell text-shell-ink hover:bg-shell-raised'
          : 'border-dashed border-rule-strong text-ink-2 hover:text-ink hover:border-ink-2'"
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
          <Plus :size="13" :stroke-width="2.25" class="flex-shrink-0" aria-hidden="true" />
          <span class="vertical text-[12px] leading-none whitespace-nowrap">漂流石</span>
        </template>
      </button>
    </span>

    <button
      type="button"
      class="flex items-center justify-center w-11 flex-shrink-0 border-l border-rule transition-colors duration-150"
      :class="locked ? 'bg-shell text-shell-ink' : 'text-ink-3 hover:text-ink hover:bg-inset'"
      :aria-pressed="locked"
      :aria-label="locked ? `解除鎖定${slotLabel}` : `鎖定${slotLabel}（自動配裝時不更換）`"
      :title="locked ? '已鎖定：自動配裝不更換' : '鎖定：自動配裝不更換'"
      @click="emit('toggleLock')"
    >
      <Lock v-if="locked" :size="17" :stroke-width="2.25" aria-hidden="true" />
      <LockOpen v-else :size="17" :stroke-width="2" aria-hidden="true" />
    </button>
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
</style>

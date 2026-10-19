<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { useBuildStore, type ArmorSlot } from '~/stores/build'
import { useSkillStore } from '~/stores/skill'
import { getPartName } from '~/stores/equipment'

/**
 * The skill ledger: a fixed-column table that updates in place. Rows keep the
 * catalogue order, so swapping gear changes values without shuffling rows.
 * Each row opens to show which pieces supply its levels.
 */
const buildStore = useBuildStore()
const skillStore = useSkillStore()

const ARMOR_SLOTS: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']

const order = computed(() => new Map(skillStore.skills.map((s, i) => [s.id, i])))

const entries = computed(() =>
  [...buildStore.skillSummary].sort(
    (a, b) => (order.value.get(a.id) ?? 9999) - (order.value.get(b.id) ?? 9999)
  )
)

const maxedCount = computed(() => entries.value.filter(e => e.total >= e.max).length)

interface Source { label: string; detail: string; level: number }

const sources = computed(() => {
  const map = new Map<string, Source[]>()
  const push = (id: string, s: Source) => {
    const list = map.get(id) ?? []
    list.push(s)
    map.set(id, list)
  }
  if (buildStore.weapon) {
    for (const s of buildStore.weapon.skills) {
      push(s.skillId, { label: '武器', detail: buildStore.weapon.name, level: s.level })
    }
  }
  for (const slot of ARMOR_SLOTS) {
    const piece = buildStore[slot]
    if (!piece) continue
    for (const s of piece.skills) {
      push(s.skillId, { label: getPartName(slot), detail: piece.name, level: s.level })
    }
    buildStore.driftstoneSkills[slot].forEach((id, i) => {
      if (id) push(id, { label: '漂流石', detail: `${getPartName(slot)} 第 ${i + 1} 槽`, level: 1 })
    })
  }
  return map
})

// Skills present at first paint stay still; a skill that arrives later heats in.
const initialIds = ref<Set<string> | null>(null)
onMounted(() => {
  initialIds.value = new Set(entries.value.map(e => e.id))
})

const open = ref<Set<string>>(new Set())
function toggle(id: string) {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}
</script>

<template>
  <div>
    <div
      v-if="!entries.length"
      class="px-4 py-10 text-center border border-dashed border-rule-strong rounded-md"
    >
      <p class="text-[15px] font-bold">還沒有任何技能</p>
      <p class="mt-1 text-[14px] text-ink-2">裝上武器或防具，技能等級會依序在這裡回火成形。</p>
    </div>

    <template v-else>
      <p class="sr-only">共 {{ entries.length }} 項技能，其中 {{ maxedCount }} 項已達最高等級。</p>
      <TransitionGroup
        tag="ul"
        name="ledger"
        class="relative bg-panel border border-rule rounded-md divide-y divide-rule overflow-hidden"
      >
        <li v-for="entry in entries" :key="entry.id">
          <button
            type="button"
            class="w-full grid grid-cols-[minmax(0,1fr)_minmax(6.5rem,auto)_3.25rem_1rem] items-center gap-x-2.5 pl-4 pr-3 min-h-[52px] py-2 text-left transition-colors duration-150 hover:bg-inset"
            :aria-expanded="open.has(entry.id)"
            :aria-controls="`src-${entry.id}`"
            @click="toggle(entry.id)"
          >
            <span class="min-w-0">
              <span class="block text-[15px] font-medium leading-snug">{{ entry.name }}</span>
              <span v-if="entry.overflow" class="block text-[12px] font-bold text-danger leading-tight">
                超出上限 {{ entry.total - entry.max }} 級
              </span>
            </span>
            <TemperBar
              :total="entry.total"
              :max="entry.max"
              :heat-on-mount="!!initialIds && !initialIds.has(entry.id)"
              :label="`${entry.name} 等級 ${entry.total}，上限 ${entry.max}`"
            />
            <span class="stamp text-right leading-none whitespace-nowrap">
              <span class="text-[22px] font-extrabold" :class="entry.overflow ? 'text-danger' : ''">{{ entry.total }}</span>
              <span class="text-[15px] font-semibold text-ink-2">/{{ entry.max }}</span>
            </span>
            <ChevronDown
              :size="16"
              :stroke-width="2"
              class="text-ink-3 transition-transform duration-200"
              :class="open.has(entry.id) ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </button>
          <ul
            v-show="open.has(entry.id)"
            :id="`src-${entry.id}`"
            class="pl-4 pr-4 pb-3 -mt-0.5 grid gap-1 text-[13px]"
          >
            <li
              v-for="(src, i) in sources.get(entry.id) ?? []"
              :key="i"
              class="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-2 items-baseline"
            >
              <span class="text-ink-2">{{ src.label }}</span>
              <span class="truncate">{{ src.detail }}</span>
              <span class="stamp font-bold text-[14px]">+{{ src.level }}</span>
            </li>
          </ul>
        </li>
      </TransitionGroup>
    </template>
  </div>
</template>

<style scoped>
.ledger-enter-active,
.ledger-leave-active {
  transition: opacity 280ms var(--ease-out-quint), transform 280ms var(--ease-out-quint);
}
.ledger-enter-from,
.ledger-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
.ledger-move {
  transition: transform 280ms var(--ease-out-quint);
}
.ledger-leave-active {
  position: absolute;
  inset-inline: 0;
}
</style>

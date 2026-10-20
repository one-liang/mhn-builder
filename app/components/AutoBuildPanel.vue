<script setup lang="ts">
import { LoaderCircle, Lock, Plus, Search, SlidersHorizontal, X } from 'lucide-vue-next'
import { useAutoBuildStore } from '~/stores/autoBuild'
import { useSkillStore } from '~/stores/skill'
import { getPartName } from '~/stores/equipment'
import type { BuildResult } from '~/stores/autoBuild'

const emit = defineEmits<{
  (e: 'searchComplete'): void
}>()

const autoBuildStore = useAutoBuildStore()
const skillStore = useSkillStore()

const skillPickerOpen = ref(false)
const includeId = useId()

const excludedSkillIds = computed(() => autoBuildStore.targetSkills.map(t => t.skillId))

watch(() => autoBuildStore.isRunning, (isRunning, wasRunning) => {
  if (wasRunning && !isRunning && autoBuildStore.hasRun) {
    emit('searchComplete')
  }
})

function onSkillsSelected(skillIds: string[]) {
  for (const skillId of skillIds) {
    const skill = skillStore.getById(skillId)
    autoBuildStore.addTargetSkill(skillId, skill ? skill.maxLevel : 1)
  }
}

function onSkillsDeselected(skillIds: string[]) {
  for (const skillId of skillIds) autoBuildStore.removeTargetSkill(skillId)
}

function getSkillName(skillId: string): string {
  return skillStore.getById(skillId)?.name ?? skillId
}

function getSkillMaxLevel(skillId: string): number {
  return skillStore.getById(skillId)?.maxLevel ?? 5
}

const appliedResult = computed(() =>
  autoBuildStore.results.find(r => r.rank === autoBuildStore.appliedRank) ?? autoBuildStore.results[0] ?? null
)

const lockedCount = computed(() => autoBuildStore.lockedSlots.size)

const PARTS = ['head', 'chest', 'arms', 'waist', 'legs'] as const

function missingTotal(r: BuildResult) {
  return r.unmetSkills.reduce((n, u) => n + u.missing, 0)
}

// What sets a plan apart from the best one: the pieces it swaps in, by name.
function swapsFromBest(r: BuildResult): { part: string; name: string }[] {
  const best = autoBuildStore.results[0]
  if (!best || best.rank === r.rank) return []
  return PARTS
    .filter(p => r.armor[p]?.id !== best.armor[p]?.id)
    .map(p => ({ part: getPartName(p), name: r.armor[p]?.name ?? '不裝備' }))
}
</script>

<template>
  <div class="bg-panel border border-rule rounded-md">
    <!-- Results -->
    <template v-if="autoBuildStore.hasRun">
      <div v-if="!autoBuildStore.results.length" class="p-4">
        <p class="text-[15px] font-bold">找不到符合條件的配裝</p>
        <p class="mt-1 text-[14px] text-ink-2">試著降低目標等級、減少目標技能，或解除部位鎖定。</p>
      </div>

      <template v-else>
        <fieldset class="p-4 pb-3">
          <legend class="sr-only">搜尋結果</legend>
          <p class="text-[13px] text-ink-2 mb-2">點選方案即套用到下方裝備。</p>
          <div class="grid gap-2" :class="autoBuildStore.results.length > 1 ? 'grid-cols-3' : 'grid-cols-1'">
            <button
              v-for="r in autoBuildStore.results"
              :key="r.rank"
              type="button"
              class="flex flex-col items-start gap-0.5 px-3 py-2 rounded-sm border text-left transition-colors duration-150"
              :class="appliedResult?.rank === r.rank
                ? 'bg-shell border-shell text-shell-ink'
                : 'bg-panel border-rule hover:border-ink-2'"
              :aria-pressed="appliedResult?.rank === r.rank"
              @click="autoBuildStore.applyResult(r)"
            >
              <span class="text-[12px]" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">方案 {{ r.rank }}</span>
              <span class="stamp text-[22px] font-extrabold leading-none">{{ Math.round(r.coveragePercent) }}<span class="text-[14px]">%</span></span>
              <span class="text-[12px] leading-snug whitespace-nowrap" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">
                <template v-if="missingTotal(r)">差 <span class="stamp text-[14px] font-bold">{{ missingTotal(r) }}</span> 級</template>
                <template v-else>全部達成</template>
              </span>
              <span class="text-[12px] leading-snug whitespace-nowrap" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">
                防禦 <span class="stamp text-[14px] font-bold">{{ r.totalDefense }}</span>
              </span>
              <span
                v-if="r.rank === autoBuildStore.results[0]?.rank"
                class="mt-1 text-[12px] font-bold leading-snug"
                :class="appliedResult?.rank === r.rank ? 'text-shell-ink' : 'text-ink'"
              >最佳組合</span>
              <span
                v-for="swap in swapsFromBest(r)"
                :key="swap.part"
                class="mt-1 w-full text-[12px] leading-snug"
                :class="appliedResult?.rank === r.rank ? 'text-shell-ink' : 'text-ink'"
              >
                <span class="block" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">換{{ swap.part }}</span>
                <span class="block font-bold break-all">{{ swap.name }}</span>
              </span>
              <span
                v-if="r.rank !== autoBuildStore.results[0]?.rank && !swapsFromBest(r).length"
                class="mt-1 text-[12px] font-bold leading-snug"
                :class="appliedResult?.rank === r.rank ? 'text-shell-ink' : 'text-ink'"
              >防具相同，漂流石不同</span>
            </button>
          </div>
        </fieldset>

        <div v-if="appliedResult && appliedResult.unmetSkills.length" class="px-4 pb-3">
          <p class="text-[13px] font-bold text-danger">還差</p>
          <ul class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[14px]">
            <li v-for="u in appliedResult.unmetSkills" :key="u.skillId" class="whitespace-nowrap">
              {{ u.name }} <span class="stamp font-bold text-danger">Lv{{ u.missing }}</span>
            </li>
          </ul>
        </div>
      </template>

      <div class="flex border-t border-rule">
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-2 h-12 text-[14px] font-bold text-ink hover:bg-inset transition-colors duration-200"
          @click="autoBuildStore.resetSearch()"
        >
          <SlidersHorizontal :size="16" :stroke-width="2" aria-hidden="true" />
          修改搜尋條件
        </button>
      </div>
    </template>

    <!-- Search form -->
    <template v-else>
      <div class="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <p class="text-[14px] font-bold">
          目標技能
          <span class="stamp text-[15px] text-ink-2 font-semibold ml-1">{{ autoBuildStore.targetSkills.length }}/6</span>
        </p>
        <button
          v-if="autoBuildStore.targetSkills.length > 0"
          type="button"
          class="h-11 px-2 -mr-2 text-[13px] text-ink-2 hover:text-ink underline underline-offset-4 decoration-rule-strong"
          @click="autoBuildStore.clearTargets()"
        >全部清除</button>
      </div>

      <ul v-if="autoBuildStore.targetSkills.length" class="border-y border-rule divide-y divide-rule">
        <li
          v-for="target in autoBuildStore.targetSkills"
          :key="target.skillId"
          class="pl-4 pr-1 pb-3"
        >
          <div class="flex items-center gap-2">
            <span class="flex-1 min-w-0 text-[15px] font-bold truncate">{{ getSkillName(target.skillId) }}</span>
            <span class="text-[13px] text-ink-2">目標 <span class="stamp text-[16px] font-bold text-ink">Lv{{ target.desiredLevel }}</span></span>
            <button
              type="button"
              class="flex items-center justify-center size-11 text-ink-3 hover:text-danger transition-colors duration-150"
              :aria-label="`移除 ${getSkillName(target.skillId)}`"
              @click="autoBuildStore.removeTargetSkill(target.skillId)"
            >
              <X :size="16" :stroke-width="2.25" aria-hidden="true" />
            </button>
          </div>
          <div class="pr-3">
            <TemperBar
              selectable
              :total="target.desiredLevel"
              :max="getSkillMaxLevel(target.skillId)"
              :label="`${getSkillName(target.skillId)} 目標等級`"
              @select="(lv) => autoBuildStore.updateTargetSkillLevel(target.skillId, lv)"
            />
          </div>
        </li>
      </ul>

      <div class="px-4 pt-3 flex flex-col gap-3">
        <button
          type="button"
          class="flex items-center justify-center gap-1.5 h-11 rounded-sm border border-dashed border-rule-strong text-[14px] font-medium text-ink-2 hover:text-ink hover:border-ink-2 transition-colors duration-200 disabled:opacity-50"
          :disabled="autoBuildStore.targetSkills.length >= 6"
          @click="skillPickerOpen = true"
        >
          <Plus :size="16" :stroke-width="2.25" aria-hidden="true" />
          {{ autoBuildStore.targetSkills.length ? '加入或移除目標技能' : '選擇想要的技能' }}
        </button>

        <div class="flex items-center justify-between gap-3">
          <label :for="includeId" class="text-[14px] cursor-pointer">
            用漂流石補足技能
            <span class="block text-[12px] text-ink-2">會自動填入空的漂流石槽</span>
          </label>
          <button
            :id="includeId"
            type="button"
            role="switch"
            :aria-checked="autoBuildStore.includeDriftstones"
            class="relative inline-flex items-center h-7 w-12 flex-shrink-0 rounded-sm border transition-colors duration-200"
            :class="autoBuildStore.includeDriftstones ? 'bg-shell border-shell' : 'bg-inset border-rule-strong'"
            @click="autoBuildStore.includeDriftstones = !autoBuildStore.includeDriftstones"
          >
            <span
              class="inline-block size-5 rounded-[2px] transition-transform duration-200"
              :class="autoBuildStore.includeDriftstones ? 'translate-x-6 bg-shell-ink' : 'translate-x-0.5 bg-panel border border-rule-strong'"
            />
          </button>
        </div>

        <p v-if="lockedCount" class="flex items-center gap-1.5 text-[13px] text-ink-2">
          <Lock :size="14" :stroke-width="2" aria-hidden="true" />
          已鎖定 {{ lockedCount }} 個部位，搜尋時不會更換。
        </p>

        <p v-if="autoBuildStore.error" class="text-[14px] text-danger" role="alert">
          {{ autoBuildStore.error }}
        </p>
      </div>

      <div class="p-4">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 h-12 rounded-sm bg-shell text-shell-ink text-[15px] font-bold transition-colors duration-200 hover:bg-shell-raised disabled:opacity-45"
          :disabled="autoBuildStore.isRunning || autoBuildStore.targetSkills.length === 0"
          @click="autoBuildStore.run()"
        >
          <LoaderCircle v-if="autoBuildStore.isRunning" :size="18" class="animate-spin" aria-hidden="true" />
          <Search v-else :size="18" :stroke-width="2.25" aria-hidden="true" />
          {{ autoBuildStore.isRunning ? '搜尋中…' : '開始搜尋' }}
        </button>
      </div>
    </template>
  </div>

  <AutoBuildSkillPicker
    v-model:open="skillPickerOpen"
    :exclude-ids="excludedSkillIds"
    @select-many="onSkillsSelected"
    @deselect-many="onSkillsDeselected"
  />
</template>

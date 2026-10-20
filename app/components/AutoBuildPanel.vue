<script setup lang="ts">
import { Lock, Plus, Search, SlidersHorizontal, X } from 'lucide-vue-next'
import { useAutoBuildStore } from '~/stores/autoBuild'
import { useSkillStore } from '~/stores/skill'
import { getPartName, getWeaponTypeName, WEAPON_TYPES } from '~/stores/equipment'
import { useBuildStore } from '~/stores/build'
import type { BuildResult } from '~/stores/autoBuild'

const emit = defineEmits<{
  (e: 'searchComplete'): void
}>()

const autoBuildStore = useAutoBuildStore()
const skillStore = useSkillStore()
const buildStore = useBuildStore()

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
  const swaps = PARTS
    .filter(p => r.armor[p]?.id !== best.armor[p]?.id)
    .map(p => ({ part: getPartName(p), name: r.armor[p]?.name ?? '不裝備' }))
  if (r.weapon?.id !== best.weapon?.id) swaps.unshift({ part: '武器', name: r.weapon?.name ?? '不裝備' })
  return swaps
}

const weaponTypes = WEAPON_TYPES.map(type => ({ type, name: getWeaponTypeName(type) }))

// Weapon skills that only appear after custom enhancement, on the applied plan's weapon
const enhancementNotes = computed(() => {
  const w = appliedResult.value?.weapon
  if (!w) return []
  return w.skills
    .filter(s => s.requiredCustomEnhancementLevel)
    .map(s => ({
      id: s.skillId,
      name: skillStore.getById(s.skillId)?.name ?? s.skillId,
      level: s.requiredCustomEnhancementLevel!,
    }))
})
</script>

<template>
  <div class="bg-panel border border-rule rounded-md">
    <!-- Searching: placeholder plans and a way out -->
    <div v-if="autoBuildStore.isRunning" class="p-4" role="status" aria-live="polite">
      <p class="sr-only">搜尋中</p>
      <div class="grid grid-cols-3 gap-2" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton h-[104px] rounded-sm" />
      </div>
      <div class="skeleton mt-3 h-4 w-2/3 rounded-sm" aria-hidden="true" />
      <button
        type="button"
        class="mt-4 w-full flex items-center justify-center gap-2 h-12 rounded-sm border border-rule-strong text-[15px] font-bold text-ink hover:bg-inset transition-colors duration-200"
        @click="autoBuildStore.cancel()"
      >
        <X :size="18" :stroke-width="2.25" aria-hidden="true" />
        取消搜尋
      </button>
    </div>

    <!-- Results -->
    <template v-else-if="autoBuildStore.hasRun">
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

        <div v-if="appliedResult?.weapon" class="px-4 pb-3 text-[14px]">
          <p>
            <span class="text-ink-2">武器</span>
            <span class="ml-1.5 font-bold">{{ appliedResult.weapon.name }}</span>
            <span class="ml-1.5 text-[13px] text-ink-2">攻擊 <span class="stamp text-[14px] font-bold text-ink">{{ appliedResult.weapon.attack }}</span></span>
          </p>
          <p v-for="n in enhancementNotes" :key="n.id" class="mt-0.5 text-[13px] text-ink-2">
            {{ n.name }}需強化 <span class="stamp text-[14px] font-bold text-ink">Lv{{ n.level }}</span>
          </p>
        </div>

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

        <div v-if="autoBuildStore.weaponLocked" class="flex items-center gap-1.5 text-[14px]">
          <Lock :size="14" :stroke-width="2" class="text-ink-2" aria-hidden="true" />
          <span class="text-ink-2">武器已鎖定</span>
          <span class="font-bold truncate">{{ buildStore.weapon?.name ?? '不裝備武器' }}</span>
        </div>
        <fieldset v-else>
          <legend class="text-[14px] font-bold">武器類型</legend>
          <div class="strip -mx-4 px-4 mt-1.5 flex gap-1.5 overflow-x-auto md:mx-0 md:px-0 md:grid md:grid-cols-7 md:overflow-visible">
            <button
              v-for="wt in weaponTypes"
              :key="wt.type"
              type="button"
              class="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-16 md:w-auto h-16 rounded-sm border text-[12px] transition-colors duration-150"
              :class="autoBuildStore.weaponType === wt.type
                ? 'bg-shell border-shell text-shell-ink font-bold'
                : 'border-rule text-ink-2 hover:text-ink hover:border-ink-2'"
              :aria-pressed="autoBuildStore.weaponType === wt.type"
              @click="autoBuildStore.weaponType = wt.type"
            >
              <WeaponTypeIcon :type="wt.type" class="size-6" aria-hidden="true" />
              {{ wt.name }}
            </button>
          </div>
        </fieldset>

        <div class="flex items-center justify-between gap-3">
          <label :for="includeId" class="text-[14px] cursor-pointer">
            用漂流石補足技能
            <span class="block text-[12px] text-ink-2">
              {{ autoBuildStore.includeDriftstones ? '會自動填入漂流石槽' : '只看武器與防具本身的技能，保留你原本的漂流石' }}
            </span>
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
          :disabled="autoBuildStore.targetSkills.length === 0 || autoBuildStore.needsWeaponType"
          @click="autoBuildStore.run()"
        >
          <Search :size="18" :stroke-width="2.25" aria-hidden="true" />
          {{ autoBuildStore.needsWeaponType && autoBuildStore.targetSkills.length ? '先選武器類型' : '開始搜尋' }}
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

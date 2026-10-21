<script setup lang="ts">
import { Camera, Lock, Plus, Search, SlidersHorizontal, X } from 'lucide-vue-next'
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
const colorOf = useSkillColor()

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

const { busy: shotBusy, shootResult } = useBuildShot()

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
  <div class="px-4 pb-4">
    <!-- Searching: placeholder plans and a way out -->
    <div v-if="autoBuildStore.isRunning" role="status" aria-live="polite">
      <p class="sr-only">搜尋中</p>
      <div class="grid grid-cols-3 gap-2" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton h-[120px] rounded-[16px]" />
      </div>
      <div class="skeleton mt-3 h-4 w-2/3 rounded-full" aria-hidden="true" />
      <button type="button" class="mt-4 w-full btn btn-secondary" @click="autoBuildStore.cancel()">
        <X :size="18" :stroke-width="2.25" aria-hidden="true" />
        取消搜尋
      </button>
    </div>

    <!-- Results -->
    <template v-else-if="autoBuildStore.hasRun">
      <div v-if="!autoBuildStore.results.length" class="py-2">
        <p class="text-[16px] font-bold">找不到符合條件的配裝</p>
        <p class="mt-1 text-[14px] text-ink-2">試著降低目標等級、減少目標技能，或解除部位鎖定。</p>
      </div>

      <template v-else>
        <fieldset>
          <legend class="sr-only">搜尋結果</legend>
          <p class="text-[13px] text-ink-2 mb-2">點選方案即套用到下方裝備。</p>
          <div class="grid gap-2" :class="autoBuildStore.results.length > 1 ? 'grid-cols-3' : 'grid-cols-1'">
            <button
              v-for="r in autoBuildStore.results"
              :key="r.rank"
              type="button"
              class="plan flex flex-col items-start gap-0.5 p-3 rounded-[16px] text-left"
              :class="appliedResult?.rank === r.rank ? 'bg-shell text-shell-ink' : 'bg-ground hover:bg-inset'"
              :aria-pressed="appliedResult?.rank === r.rank"
              @click="autoBuildStore.applyResult(r)"
            >
              <span class="text-[12px] font-medium" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">方案 {{ r.rank }}</span>
              <span class="stamp text-[28px] font-extrabold leading-none tracking-[-0.02em]">{{ Math.round(r.coveragePercent) }}<span class="text-[15px]">%</span></span>
              <span class="mt-0.5 text-[12px] leading-snug whitespace-nowrap" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">
                <template v-if="missingTotal(r)">差 <span class="stamp text-[13px] font-bold">{{ missingTotal(r) }}</span> 級</template>
                <template v-else>全部達成</template>
              </span>
              <span class="text-[12px] leading-snug whitespace-nowrap" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">
                防禦 <span class="stamp text-[13px] font-bold">{{ r.totalDefense }}</span>
              </span>
              <span v-if="r.rank === autoBuildStore.results[0]?.rank" class="mt-1 text-[12px] font-bold leading-snug">最佳組合</span>
              <span v-for="swap in swapsFromBest(r)" :key="swap.part" class="mt-1 w-full text-[12px] leading-snug">
                <span class="block" :class="appliedResult?.rank === r.rank ? 'text-shell-ink-2' : 'text-ink-2'">換{{ swap.part }}</span>
                <span class="block font-bold break-all">{{ swap.name }}</span>
              </span>
              <span
                v-if="r.rank !== autoBuildStore.results[0]?.rank && !swapsFromBest(r).length"
                class="mt-1 text-[12px] font-bold leading-snug"
              >防具相同，漂流石不同</span>
            </button>
          </div>
        </fieldset>

        <div v-if="appliedResult?.weapon" class="mt-3 text-[14px]">
          <p>
            <span class="text-ink-2">武器</span>
            <span class="ml-1.5 font-bold">{{ appliedResult.weapon.name }}</span>
            <span class="ml-1.5 text-[13px] text-ink-2">攻擊 <span class="stamp text-[14px] font-bold text-ink">{{ appliedResult.weapon.attack }}</span></span>
          </p>
          <p v-for="n in enhancementNotes" :key="n.id" class="mt-0.5 text-[13px] text-ink-2">
            {{ n.name }}需強化 <span class="stamp text-[14px] font-bold text-ink">Lv{{ n.level }}</span>
          </p>
        </div>

        <div v-if="appliedResult && appliedResult.unmetSkills.length" class="mt-3">
          <p class="text-[13px] font-bold text-danger">還差</p>
          <ul class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[14px]">
            <li v-for="u in appliedResult.unmetSkills" :key="u.skillId" class="inline-flex items-center gap-1.5 whitespace-nowrap">
              <SkillDot :skill-id="u.skillId" :size="8" />{{ u.name }} <span class="stamp font-bold text-danger">Lv{{ u.missing }}</span>
            </li>
          </ul>
        </div>
      </template>

      <div class="mt-4 flex gap-2">
        <button type="button" class="btn btn-secondary flex-1" @click="autoBuildStore.resetSearch()">
          <SlidersHorizontal :size="17" :stroke-width="2.25" aria-hidden="true" />
          修改條件
        </button>
        <button
          v-if="appliedResult"
          type="button"
          class="btn btn-secondary flex-1"
          :disabled="shotBusy"
          :aria-label="`截圖方案 ${appliedResult.rank}，可直接貼到聊天室`"
          @click="shootResult(appliedResult)"
        >
          <Camera :size="17" :stroke-width="2.25" aria-hidden="true" />
          截圖方案 {{ appliedResult.rank }}
        </button>
      </div>
    </template>

    <!-- Search form -->
    <template v-else>
      <div class="flex items-center justify-between gap-3 pb-2">
        <p class="text-[15px] font-bold">
          目標技能
          <span class="stamp text-[14px] text-ink-2 font-semibold ml-1">{{ autoBuildStore.targetSkills.length }}/6</span>
        </p>
        <button
          v-if="autoBuildStore.targetSkills.length > 0"
          type="button"
          class="h-10 px-3 -mr-3 rounded-full text-[13px] font-medium text-ink-2 hover:text-ink hover:bg-inset"
          @click="autoBuildStore.clearTargets()"
        >全部清除</button>
      </div>

      <ul v-if="autoBuildStore.targetSkills.length" class="grid gap-2 mb-2">
        <li
          v-for="target in autoBuildStore.targetSkills"
          :key="target.skillId"
          class="rounded-[16px] bg-inset pl-3 pr-1 pb-3"
        >
          <div class="flex items-center gap-2">
            <SkillDot :skill-id="target.skillId" />
            <span class="flex-1 min-w-0 text-[15px] font-bold truncate">{{ getSkillName(target.skillId) }}</span>
            <span class="text-[13px] text-ink-2">目標 <span class="stamp text-[16px] font-bold text-ink">Lv{{ target.desiredLevel }}</span></span>
            <button
              type="button"
              class="flex items-center justify-center size-11 rounded-full text-ink-2 hover:text-danger"
              :aria-label="`移除 ${getSkillName(target.skillId)}`"
              @click="autoBuildStore.removeTargetSkill(target.skillId)"
            >
              <X :size="16" :stroke-width="2.25" aria-hidden="true" />
            </button>
          </div>
          <div class="pr-2">
            <TemperBar
              selectable
              :total="target.desiredLevel"
              :max="getSkillMaxLevel(target.skillId)"
              :color="colorOf(target.skillId)"
              :label="`${getSkillName(target.skillId)} 目標等級`"
              @select="(lv) => autoBuildStore.updateTargetSkillLevel(target.skillId, lv)"
            />
          </div>
        </li>
      </ul>

      <div class="flex flex-col gap-4">
        <button
          type="button"
          class="btn w-full border-2 border-dashed border-rule-strong text-ink hover:border-ink-2"
          :disabled="autoBuildStore.targetSkills.length >= 6"
          @click="skillPickerOpen = true"
        >
          <Plus :size="17" :stroke-width="2.5" aria-hidden="true" />
          {{ autoBuildStore.targetSkills.length ? '加入或移除目標技能' : '選擇想要的技能' }}
        </button>

        <div v-if="autoBuildStore.weaponLocked" class="flex items-center gap-1.5 text-[14px]">
          <Lock :size="14" :stroke-width="2.25" class="text-ink-2" aria-hidden="true" />
          <span class="text-ink-2">武器已鎖定</span>
          <span class="font-bold truncate">{{ buildStore.weapon?.name ?? '不裝備武器' }}</span>
        </div>
        <fieldset v-else>
          <legend class="text-[15px] font-bold">武器類型</legend>
          <div class="strip -mx-4 px-4 mt-2 flex gap-2 overflow-x-auto md:mx-0 md:px-0 md:grid md:grid-cols-7 md:overflow-visible">
            <button
              v-for="wt in weaponTypes"
              :key="wt.type"
              type="button"
              class="wtype flex-shrink-0 flex flex-col items-center justify-center gap-1 w-[68px] md:w-auto h-[68px] rounded-[16px] text-[12px]"
              :class="autoBuildStore.weaponType === wt.type
                ? 'bg-shell text-shell-ink font-bold'
                : 'bg-ground text-ink-2 hover:text-ink'"
              :aria-pressed="autoBuildStore.weaponType === wt.type"
              @click="autoBuildStore.weaponType = wt.type"
            >
              <WeaponTypeIcon :type="wt.type" class="size-6" aria-hidden="true" />
              {{ wt.name }}
            </button>
          </div>
        </fieldset>

        <div class="flex items-center justify-between gap-4">
          <label :for="includeId" class="text-[15px] font-bold cursor-pointer">
            用漂流石補足技能
            <span class="block text-[13px] font-normal text-ink-2">
              {{ autoBuildStore.includeDriftstones ? '會自動填入漂流石槽' : '只看武器與防具本身的技能，保留你原本的漂流石' }}
            </span>
          </label>
          <button
            :id="includeId"
            type="button"
            role="switch"
            :aria-checked="autoBuildStore.includeDriftstones"
            class="relative inline-flex items-center h-8 w-[52px] flex-shrink-0 rounded-full"
            :class="autoBuildStore.includeDriftstones ? 'bg-shell' : 'bg-rule-strong'"
            @click="autoBuildStore.includeDriftstones = !autoBuildStore.includeDriftstones"
          >
            <span
              class="knob inline-block size-6 rounded-full bg-ground"
              :class="autoBuildStore.includeDriftstones ? 'translate-x-[24px]' : 'translate-x-1'"
              style="box-shadow: 0 1px 3px rgb(0 0 0 / 0.25)"
            />
          </button>
        </div>

        <p v-if="lockedCount" class="flex items-center gap-1.5 text-[13px] text-ink-2">
          <Lock :size="14" :stroke-width="2.25" aria-hidden="true" />
          已鎖定 {{ lockedCount }} 個部位，搜尋時不會更換。
        </p>

        <p v-if="autoBuildStore.error" class="text-[14px] text-danger" role="alert">
          {{ autoBuildStore.error }}
        </p>

        <button
          type="button"
          class="btn btn-primary w-full"
          :disabled="autoBuildStore.targetSkills.length === 0 || autoBuildStore.needsWeaponType"
          @click="autoBuildStore.run()"
        >
          <Search :size="18" :stroke-width="2.5" aria-hidden="true" />
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

<style scoped>
.plan,
.wtype {
  transition: transform 180ms var(--ease-out-quint);
}
.plan:active,
.wtype:active {
  transform: scale(0.96);
}
.knob {
  transition: transform 300ms var(--ease-spring);
}
</style>

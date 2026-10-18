<script setup lang="ts">
import { ChevronDown, ChevronUp, Gem, LoaderCircle, Plus, RotateCcw, Search, TriangleAlert, WandSparkles, X } from 'lucide-vue-next'
import { useAutoBuildStore } from '~/stores/autoBuild'
import { useSkillStore } from '~/stores/skill'

const emit = defineEmits<{
  (e: 'searchComplete'): void
}>()

const autoBuildStore = useAutoBuildStore()
const skillStore = useSkillStore()

const expanded = ref(false)
const skillPickerOpen = ref(false)

const excludedSkillIds = computed(() => autoBuildStore.targetSkills.map(t => t.skillId))

// Watch for search completion to scroll to equipment section
watch(() => autoBuildStore.isRunning, (isRunning, wasRunning) => {
  if (wasRunning && !isRunning && autoBuildStore.hasRun) {
    emit('searchComplete')
  }
})

function onSkillsSelected(skillIds: string[]) {
  for (const skillId of skillIds) {
    const skill = skillStore.getById(skillId)
    const defaultLevel = skill ? skill.maxLevel : 1
    autoBuildStore.addTargetSkill(skillId, defaultLevel)
  }
}

function onSkillsDeselected(skillIds: string[]) {
  for (const skillId of skillIds) {
    autoBuildStore.removeTargetSkill(skillId)
  }
}

function getSkillName(skillId: string): string {
  return skillStore.getById(skillId)?.name ?? skillId
}

function getSkillMaxLevel(skillId: string): number {
  return skillStore.getById(skillId)?.maxLevel ?? 5
}

const bestResult = computed(() => autoBuildStore.results[0] ?? null)
const canSearch = computed(() => autoBuildStore.targetSkills.length > 0 && !autoBuildStore.isRunning)
</script>

<template>
  <!-- Collapsed state: single toggle button -->
  <button
    v-if="!expanded"
    type="button"
    class="group flex w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-2.5 pr-3 text-left transition-colors hover:border-border-strong"
    :aria-expanded="false"
    @click="expanded = true"
  >
    <span class="cut-corner-sm flex size-10 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground">
      <WandSparkles class="size-[18px]" aria-hidden="true" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-bold text-foreground">自動配裝</span>
      <span class="block truncate text-xs text-muted-foreground">指定目標技能，自動找出最佳防具組合</span>
    </span>
    <span
      v-if="autoBuildStore.targetSkills.length"
      class="flex-shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 text-[0.6875rem] font-medium text-secondary-foreground"
    >{{ autoBuildStore.targetSkills.length }} 項目標</span>
    <ChevronDown class="size-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
  </button>

  <!-- Expanded state: full panel -->
  <section v-else class="overflow-hidden rounded-md border border-border bg-card" aria-label="自動配裝">
    <!-- Panel header -->
    <div class="flex items-center gap-3 border-b border-border p-2.5 pr-1.5">
      <span class="cut-corner-sm flex size-10 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground">
        <WandSparkles class="size-[18px]" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="text-sm font-bold text-foreground">自動配裝</h2>
        <p class="eyebrow mt-1 text-[0.625rem] text-muted-foreground">Auto Build</p>
      </div>
      <button
        type="button"
        class="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="收合自動配裝"
        :aria-expanded="true"
        @click="expanded = false"
      >
        <ChevronUp class="size-4" aria-hidden="true" />
      </button>
    </div>

    <div class="flex flex-col gap-3 p-3">
      <!-- ── Post-search result state ── -->
      <template v-if="autoBuildStore.hasRun">
        <!-- No result -->
        <div v-if="!bestResult" class="flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/10 p-3">
          <TriangleAlert class="mt-0.5 size-4 flex-shrink-0 text-warning" aria-hidden="true" />
          <p class="text-sm text-foreground">找不到符合條件的配裝，試著降低技能等級或減少目標。</p>
        </div>

        <!-- Success -->
        <template v-else>
          <dl class="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-background">
            <div class="px-3 py-2.5">
              <dt class="text-[0.6875rem] text-muted-foreground">達成率</dt>
              <dd
                class="mt-0.5 font-num text-2xl font-semibold leading-none tabular-nums"
                :class="bestResult.coveragePercent >= 100 ? 'text-positive' : 'text-warning'"
              >{{ Math.round(bestResult.coveragePercent) }}<span class="text-sm">%</span></dd>
            </div>
            <div class="px-3 py-2.5">
              <dt class="text-[0.6875rem] text-muted-foreground">搜尋組合</dt>
              <dd class="mt-0.5 font-num text-2xl font-semibold leading-none tabular-nums text-foreground">{{ autoBuildStore.searchedCombos.toLocaleString() }}</dd>
            </div>
            <div class="px-3 py-2.5">
              <dt class="text-[0.6875rem] text-muted-foreground">耗時</dt>
              <dd class="mt-0.5 font-num text-2xl font-semibold leading-none tabular-nums text-foreground">{{ Math.round(autoBuildStore.elapsedMs) }}<span class="text-sm">ms</span></dd>
            </div>
          </dl>

          <!-- Unmet skill warnings (only shown when targets not fully met) -->
          <div v-if="bestResult.unmetSkills.length > 0" class="flex flex-wrap items-center gap-1.5">
            <span class="text-[0.6875rem] text-muted-foreground">未達成</span>
            <span
              v-for="u in bestResult.unmetSkills"
              :key="u.skillId"
              class="inline-flex h-6 items-center gap-1 rounded-sm border border-warning/40 bg-warning/10 px-1.5 text-[0.6875rem] font-medium text-warning"
            >{{ u.name }}<span class="font-num text-xs font-semibold tabular-nums">−{{ u.missing }}</span></span>
          </div>
          <p class="text-xs text-muted-foreground">已將最佳組合套用到下方裝備欄。</p>
        </template>

        <button
          type="button"
          class="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          @click="autoBuildStore.resetSearch()"
        >
          <RotateCcw class="size-3.5" aria-hidden="true" />
          重新搜尋
        </button>
      </template>

      <!-- ── Search form (shown when not yet run, or after reset) ── -->
      <template v-else>
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-medium text-muted-foreground">
            目標技能
            <span class="font-num text-sm font-semibold tabular-nums text-foreground">{{ autoBuildStore.targetSkills.length }}</span>/6
          </p>
          <div class="flex items-center gap-1">
            <!-- Driftstone toggle -->
            <button
              type="button"
              role="switch"
              :aria-checked="autoBuildStore.includeDriftstones"
              class="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              @click="autoBuildStore.includeDriftstones = !autoBuildStore.includeDriftstones"
            >
              <Gem class="size-3.5 text-stone" aria-hidden="true" />
              含漂流石
              <span
                class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
                :class="autoBuildStore.includeDriftstones ? 'bg-stone' : 'bg-border-strong'"
                aria-hidden="true"
              >
                <span
                  class="inline-block size-4 rounded-full bg-card shadow-sm transition-transform duration-200"
                  :class="autoBuildStore.includeDriftstones ? 'translate-x-[18px]' : 'translate-x-0.5'"
                />
              </span>
            </button>
            <button
              v-if="autoBuildStore.targetSkills.length > 0"
              type="button"
              class="h-9 cursor-pointer rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              @click="autoBuildStore.clearTargets()"
            >清除</button>
          </div>
        </div>

        <!-- Skill rows -->
        <ul v-if="autoBuildStore.targetSkills.length > 0" class="divide-y divide-border overflow-hidden rounded-md border border-border bg-background">
          <li
            v-for="target in autoBuildStore.targetSkills"
            :key="target.skillId"
            class="flex items-center gap-2 py-1 pl-3 pr-1"
          >
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {{ getSkillName(target.skillId) }}
            </span>

            <!-- Level bars -->
            <div class="flex flex-shrink-0 items-center" role="group" :aria-label="`${getSkillName(target.skillId)} 目標等級`">
              <button
                v-for="lv in getSkillMaxLevel(target.skillId)"
                :key="lv"
                type="button"
                class="group flex h-9 w-[18px] cursor-pointer items-center justify-center"
                :aria-label="`設定等級 ${lv}`"
                :aria-pressed="lv === target.desiredLevel"
                @click="autoBuildStore.updateTargetSkillLevel(target.skillId, lv)"
              >
                <span
                  class="h-2.5 w-3.5 -skew-x-[18deg] transition-colors"
                  :class="lv <= target.desiredLevel ? 'bg-primary' : 'bg-border-strong group-hover:bg-primary/40'"
                />
              </button>
              <span class="ml-1 w-9 text-right font-num text-sm font-semibold tabular-nums text-foreground">
                <span class="text-[0.6875rem] font-medium text-muted-foreground">Lv</span>{{ target.desiredLevel }}
              </span>
            </div>

            <!-- Remove -->
            <button
              type="button"
              class="flex size-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              :aria-label="`移除 ${getSkillName(target.skillId)}`"
              @click="autoBuildStore.removeTargetSkill(target.skillId)"
            >
              <X class="size-4" aria-hidden="true" />
            </button>
          </li>
        </ul>

        <!-- Add skill button -->
        <button
          type="button"
          class="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          @click="skillPickerOpen = true"
        >
          <Plus class="size-4" aria-hidden="true" />
          {{ autoBuildStore.targetSkills.length ? '調整目標技能' : '新增目標技能' }}
        </button>

        <!-- Validation error -->
        <p v-if="autoBuildStore.error" class="flex items-center gap-1.5 text-xs text-destructive">
          <TriangleAlert class="size-3.5" aria-hidden="true" />
          {{ autoBuildStore.error }}
        </p>

        <!-- Search button -->
        <button
          type="button"
          class="cut-corner-sm flex h-11 w-full items-center justify-center gap-2 text-sm font-bold transition-[filter,background-color]"
          :class="autoBuildStore.targetSkills.length > 0
            ? 'bg-primary text-primary-foreground enabled:cursor-pointer enabled:hover:brightness-110 disabled:cursor-wait'
            : 'cursor-not-allowed bg-secondary text-muted-foreground'"
          :disabled="!canSearch"
          @click="autoBuildStore.run()"
        >
          <LoaderCircle v-if="autoBuildStore.isRunning" class="size-4 animate-spin" aria-hidden="true" />
          <Search v-else class="size-4" aria-hidden="true" />
          {{ autoBuildStore.isRunning ? '搜尋中…' : '開始搜尋' }}
        </button>
      </template>
    </div>
  </section>

  <!-- Skill picker modal -->
  <AutoBuildSkillPicker
    v-model:open="skillPickerOpen"
    :exclude-ids="excludedSkillIds"
    @select-many="onSkillsSelected"
    @deselect-many="onSkillsDeselected"
  />
</template>

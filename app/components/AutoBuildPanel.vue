<script setup lang="ts">
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
</script>

<template>
  <!-- Collapsed state: single toggle button -->
  <div v-if="!expanded">
    <button
      class="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-primary/25 bg-primary/8 hover:bg-primary/15 transition-all cursor-pointer"
      @click="expanded = true"
    >
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        <span class="text-sm font-semibold text-foreground">自動配裝</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
  </div>

  <!-- Expanded state: full panel -->
  <div
    v-else
    class="rounded-xl border border-primary/30 bg-card/60 overflow-hidden"
  >
    <!-- Panel header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        <span class="text-sm font-semibold text-foreground">自動配裝</span>
      </div>
      <button
        class="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="收合"
        @click="expanded = false"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
    </div>

    <div class="p-3 flex flex-col gap-3">
      <!-- ── Post-search result state ── -->
      <template v-if="autoBuildStore.hasRun">
        <!-- No result -->
        <div v-if="!bestResult" class="flex flex-col gap-2">
          <p class="text-sm text-center text-muted-foreground py-1">找不到符合條件的配裝</p>
          <button
            class="w-full h-9 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
            @click="autoBuildStore.resetSearch()"
          >重新搜尋</button>
        </div>

        <!-- Success: unmet skills + reset -->
        <div v-else class="flex flex-col gap-2">
          <!-- Unmet skill warnings (only shown when targets not fully met) -->
          <div v-if="bestResult.unmetSkills.length > 0" class="flex flex-wrap gap-1 px-0.5">
            <span
              v-for="u in bestResult.unmetSkills"
              :key="u.skillId"
              class="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30"
            >{{ u.name }} 缺 {{ u.missing }}</span>
          </div>
          <button
            class="w-full h-9 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
            @click="autoBuildStore.resetSearch()"
          >重新搜尋</button>
        </div>
      </template>

      <!-- ── Search form (shown when not yet run, or after reset) ── -->
      <template v-else>
        <!-- Target skills -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-[11px] text-muted-foreground">目標技能（最多 6 項）</p>
            <div class="flex items-center gap-2">
              <!-- Driftstone toggle -->
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <span class="text-[11px] text-muted-foreground">含漂流石</span>
                <button
                  role="switch"
                  :aria-checked="autoBuildStore.includeDriftstones"
                  class="relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full border-2 transition-colors"
                  :class="autoBuildStore.includeDriftstones
                    ? 'bg-primary border-primary'
                    : 'bg-secondary border-border'"
                  @click="autoBuildStore.includeDriftstones = !autoBuildStore.includeDriftstones"
                >
                  <span
                    class="inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform shadow-sm"
                    :class="autoBuildStore.includeDriftstones ? 'translate-x-2.5' : 'translate-x-0.5'"
                  />
                </button>
              </label>
              <button
                v-if="autoBuildStore.targetSkills.length > 0"
                class="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                @click="autoBuildStore.clearTargets()"
              >清除全部</button>
            </div>
          </div>

          <!-- Skill rows -->
          <div v-if="autoBuildStore.targetSkills.length > 0" class="flex flex-col gap-1.5 mb-2">
            <div
              v-for="target in autoBuildStore.targetSkills"
              :key="target.skillId"
              class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-secondary/40 border border-border"
            >
              <!-- Gem icon -->
              <div class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-primary/70"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
              </div>

              <!-- Skill name -->
              <span class="flex-1 text-sm font-medium text-foreground truncate">
                {{ getSkillName(target.skillId) }}
              </span>

              <!-- Level bars -->
              <div class="flex items-center gap-0.5 flex-shrink-0">
                <button
                  v-for="lv in getSkillMaxLevel(target.skillId)"
                  :key="lv"
                  class="w-4 h-1.5 transition-all cursor-pointer"
                  :class="lv <= target.desiredLevel
                    ? 'bg-primary'
                    : 'bg-border hover:bg-primary/40'"
                  :aria-label="`設定等級 ${lv}`"
                  @click="autoBuildStore.updateTargetSkillLevel(target.skillId, lv)"
                />
                <span class="text-xs text-primary font-semibold ml-1.5 w-6 text-right">Lv{{ target.desiredLevel }}</span>
              </div>

              <!-- Remove -->
              <button
                class="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                :aria-label="`移除 ${getSkillName(target.skillId)}`"
                @click="autoBuildStore.removeTargetSkill(target.skillId)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- Add skill button -->
          <button
            class="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            @click="skillPickerOpen = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            新增目標技能
          </button>

          <!-- Validation error -->
          <p v-if="autoBuildStore.error" class="text-xs text-destructive mt-1.5">
            {{ autoBuildStore.error }}
          </p>
        </div>

        <!-- Search button -->
        <button
          class="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all cursor-pointer"
          :class="autoBuildStore.targetSkills.length === 0
            ? 'bg-primary/30 text-primary-foreground/50 cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:brightness-110'"
          :disabled="autoBuildStore.isRunning || autoBuildStore.targetSkills.length === 0"
          @click="autoBuildStore.run()"
        >
          <svg
            v-if="autoBuildStore.isRunning"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
          ><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          {{ autoBuildStore.isRunning ? '搜尋中...' : '開始搜尋' }}
        </button>
      </template>
    </div>
  </div>

  <!-- Skill picker modal -->
  <AutoBuildSkillPicker
    v-model:open="skillPickerOpen"
    :exclude-ids="excludedSkillIds"
    @select-many="onSkillsSelected"
    @deselect-many="onSkillsDeselected"
  />
</template>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>

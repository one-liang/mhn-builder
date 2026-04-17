<script setup lang="ts">
import { useAutoBuildStore } from '~/stores/autoBuild'
import { useSkillStore } from '~/stores/skill'
import { getWeaponTypeName } from '~/stores/equipment'
import type { BuildResult } from '~/lib/autoBuildAlgorithm'

const emit = defineEmits<{
  (e: 'apply', result: BuildResult): void
}>()

const autoBuildStore = useAutoBuildStore()
const skillStore = useSkillStore()

const expanded = ref(false)
const skillPickerOpen = ref(false)

const WEAPON_TYPES = [
  'great-sword', 'long-sword', 'sword-and-shield', 'dual-blades',
  'hammer', 'hunting-horn', 'lance', 'gunlance', 'switch-axe',
  'charge-blade', 'insect-glaive', 'light-bowgun', 'heavy-bowgun', 'bow',
]

const excludedSkillIds = computed(() => autoBuildStore.targetSkills.map(t => t.skillId))

function onSkillSelected(skillId: string) {
  const skill = skillStore.getById(skillId)
  const defaultLevel = skill ? Math.ceil(skill.maxLevel / 2) : 1
  autoBuildStore.addTargetSkill(skillId, defaultLevel)
}

function getSkillName(skillId: string): string {
  return skillStore.getById(skillId)?.name ?? skillId
}

function getSkillMaxLevel(skillId: string): number {
  return skillStore.getById(skillId)?.maxLevel ?? 5
}

function onApply(result: BuildResult) {
  autoBuildStore.applyResult(result)
  emit('apply', result)
  expanded.value = false
}

function getArmorPartName(part: string): string {
  const names: Record<string, string> = {
    head: '頭', chest: '胸', arms: '腕', waist: '腰', legs: '腿',
  }
  return names[part] ?? part
}

const ARMOR_PARTS = ['head', 'chest', 'arms', 'waist', 'legs'] as const
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
        <span v-if="autoBuildStore.hasRun" class="text-[11px] text-primary bg-primary/15 px-1.5 py-0.5 rounded">
          {{ autoBuildStore.results.length }} 個建議
        </span>
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
      <!-- Weapon type filter -->
      <div>
        <p class="text-[11px] text-muted-foreground mb-1.5">武器類型（可選）</p>
        <div class="flex flex-nowrap overflow-x-auto scrollbar-none sm:flex-wrap sm:overflow-visible gap-1.5 pb-1">
          <button
            class="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap"
            :class="autoBuildStore.weaponType === ''
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-secondary/60 border-border text-muted-foreground hover:border-primary/30'"
            @click="autoBuildStore.weaponType = ''"
          >全部</button>
          <button
            v-for="wt in WEAPON_TYPES"
            :key="wt"
            class="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap"
            :class="autoBuildStore.weaponType === wt
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-secondary/60 border-border text-muted-foreground hover:border-primary/30'"
            @click="autoBuildStore.weaponType = wt"
          >{{ getWeaponTypeName(wt) }}</button>
        </div>
      </div>

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
              class="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
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
            <!-- Skill name -->
            <span class="flex-1 text-sm font-medium text-foreground truncate">
              {{ getSkillName(target.skillId) }}
            </span>

            <!-- Level dots -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                v-for="lv in getSkillMaxLevel(target.skillId)"
                :key="lv"
                class="w-4 h-4 rounded-full border-2 transition-all cursor-pointer"
                :class="lv <= target.desiredLevel
                  ? 'bg-primary border-primary shadow-[0_0_4px_var(--color-primary)]'
                  : 'bg-transparent border-border hover:border-primary/50'"
                :aria-label="`設定等級 ${lv}`"
                @click="autoBuildStore.updateTargetSkillLevel(target.skillId, lv)"
              />
              <span class="text-xs text-primary font-semibold ml-1 w-6 text-right">Lv{{ target.desiredLevel }}</span>
            </div>

            <!-- Remove -->
            <button
              class="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
              :aria-label="`移除 ${getSkillName(target.skillId)}`"
              @click="autoBuildStore.removeTargetSkill(target.skillId)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Add skill button -->
        <button
          v-if="autoBuildStore.targetSkills.length < 6"
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

      <!-- Results -->
      <template v-if="autoBuildStore.hasRun">
        <!-- Stats line -->
        <p v-if="autoBuildStore.results.length === 0" class="text-sm text-center text-muted-foreground py-2">
          找不到符合條件的配裝
        </p>

        <!-- Result cards -->
        <div
          v-for="result in autoBuildStore.results"
          :key="result.rank"
          class="rounded-lg border border-border bg-card/80 overflow-hidden"
        >
          <!-- Card header -->
          <div class="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-secondary/20">
            <span class="flex-shrink-0 px-1.5 py-0.5 rounded text-[11px] font-bold bg-primary/20 text-primary">
              #{{ result.rank }}
            </span>
            <!-- Coverage bar -->
            <div class="flex-1 flex items-center gap-2 min-w-0">
              <div class="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="result.coveragePercent === 100 ? 'bg-primary' : 'bg-primary/60'"
                  :style="{ width: `${result.coveragePercent}%` }"
                />
              </div>
              <span class="flex-shrink-0 text-[11px] font-semibold"
                :class="result.coveragePercent === 100 ? 'text-primary' : 'text-muted-foreground'">
                {{ result.coveragePercent }}%
              </span>
            </div>
            <span class="flex-shrink-0 text-[11px] text-muted-foreground">防 {{ result.totalDefense }}</span>
          </div>

          <!-- Equipment rows -->
          <div class="px-3 py-2 flex flex-col gap-1">
            <!-- Weapon -->
            <div v-if="result.weapon" class="flex items-center gap-2 min-w-0">
              <span class="flex-shrink-0 text-[10px] text-muted-foreground w-4">武</span>
              <span class="text-xs text-foreground truncate flex-1">{{ result.weapon.name }}</span>
              <div class="flex gap-1 flex-shrink-0">
                <span
                  v-for="s in result.weapon.skills.slice(0, 2)"
                  :key="s.skillId"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25"
                >{{ skillStore.getById(s.skillId)?.name ?? s.skillId }} Lv{{ s.level }}</span>
              </div>
            </div>

            <!-- Armor pieces -->
            <template
              v-for="part in ARMOR_PARTS"
              :key="part"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="flex-shrink-0 text-[10px] text-muted-foreground w-4">{{ getArmorPartName(part) }}</span>
                <span class="text-xs text-foreground truncate flex-1">{{ result.armor[part]?.name ?? '—' }}</span>
                <div class="flex gap-1 flex-shrink-0">
                  <span
                    v-for="s in (result.armor[part]?.skills ?? []).slice(0, 2)"
                    :key="s.skillId"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/60 text-muted-foreground border border-border"
                  >{{ skillStore.getById(s.skillId)?.name ?? s.skillId }} Lv{{ s.level }}</span>
                </div>
              </div>
              <!-- Driftstone assignments for this slot -->
              <div
                v-if="result.driftstoneAssignments?.[part]?.some(s => s)"
                class="flex items-center gap-1 pl-5 flex-wrap"
              >
                <template v-for="(skillId, idx) in result.driftstoneAssignments![part]" :key="idx">
                  <span
                    v-if="skillId"
                    class="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 border border-primary/25"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
                    {{ skillStore.getById(skillId)?.name ?? skillId }}
                  </span>
                </template>
              </div>
            </template>
          </div>

          <!-- Unmet skills -->
          <div v-if="result.unmetSkills.length > 0" class="px-3 pb-2 flex flex-wrap gap-1">
            <span
              v-for="u in result.unmetSkills"
              :key="u.skillId"
              class="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30"
            >{{ u.name }} -{{ u.missing }}</span>
          </div>

          <!-- Apply button -->
          <div class="px-3 pb-2.5">
            <button
              class="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all cursor-pointer"
              @click="onApply(result)"
            >
              套用此配裝
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Skill picker modal -->
  <AutoBuildSkillPicker
    v-model:open="skillPickerOpen"
    :exclude-ids="excludedSkillIds"
    @select="onSkillSelected"
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

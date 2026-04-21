import { defineStore } from 'pinia'
import { useEquipmentStore } from './equipment'
import { useSkillStore } from './skill'
import { useBuildStore } from './build'
import type { BuildSlot } from './build'
import { runAutoBuild } from '~/lib/autoBuildAlgorithm'
import type { TargetSkill, BuildResult } from '~/lib/autoBuildAlgorithm'
import type { Armor } from './equipment'
import driftstoneData from '../../data/driftstone-skills.json'

const DRIFTSTONE_SKILL_IDS = new Set(driftstoneData.achievableSkillIds)

export type { TargetSkill, BuildResult }

export const useAutoBuildStore = defineStore('autoBuild', () => {
  const equipmentStore = useEquipmentStore()
  const skillStore = useSkillStore()
  const buildStore = useBuildStore()

  // ── Input state ──────────────────────────────────────────────────────────
  const targetSkills = ref<TargetSkill[]>([])
  const includeDriftstones = ref(false)

  // ── Output state ─────────────────────────────────────────────────────────
  const results = ref<BuildResult[]>([])
  const isRunning = ref(false)
  const hasRun = ref(false)
  const searchedCombos = ref(0)
  const elapsedMs = ref(0)
  const error = ref<string | null>(null)
  const appliedRank = ref<number | null>(null)

  // ── Lock state ───────────────────────────────────────────────────────────
  const lockedSlots = ref<Set<BuildSlot>>(new Set())

  function toggleLock(slot: BuildSlot) {
    const next = new Set(lockedSlots.value)
    if (next.has(slot)) next.delete(slot)
    else next.add(slot)
    lockedSlots.value = next
  }

  function isLocked(slot: BuildSlot): boolean {
    return lockedSlots.value.has(slot)
  }

  // ── Target skill management ──────────────────────────────────────────────
  function addTargetSkill(skillId: string, desiredLevel: number) {
    if (targetSkills.value.some(t => t.skillId === skillId)) return
    if (targetSkills.value.length >= 6) return
    targetSkills.value.push({ skillId, desiredLevel })
  }

  function removeTargetSkill(skillId: string) {
    const idx = targetSkills.value.findIndex(t => t.skillId === skillId)
    if (idx !== -1) targetSkills.value.splice(idx, 1)
  }

  function updateTargetSkillLevel(skillId: string, level: number) {
    const target = targetSkills.value.find(t => t.skillId === skillId)
    if (target) target.desiredLevel = level
  }

  function clearTargets() {
    targetSkills.value = []
    results.value = []
    hasRun.value = false
    error.value = null
    appliedRank.value = null
  }

  function resetSearch() {
    results.value = []
    hasRun.value = false
    error.value = null
    appliedRank.value = null
  }

  // ── Run algorithm ────────────────────────────────────────────────────────
  async function run() {
    if (targetSkills.value.length === 0) {
      error.value = '請至少新增一項目標技能'
      return
    }
    error.value = null
    isRunning.value = true

    // Ensure data is loaded
    await Promise.all([equipmentStore.load(), skillStore.load()])

    // Build skill lookup map for the algorithm
    const skillMap = new Map(
      skillStore.skills.map(s => [s.id, { id: s.id, maxLevel: s.maxLevel, name: s.name }])
    )

    // Build locked armor references
    const lockedArmor: Partial<Record<'head' | 'chest' | 'arms' | 'waist' | 'legs', Armor>> = {}
    for (const p of ['head', 'chest', 'arms', 'waist', 'legs'] as const) {
      if (lockedSlots.value.has(p) && buildStore[p]) lockedArmor[p] = buildStore[p]!
    }

    try {
      const result = runAutoBuild(
        {
          targetSkills: targetSkills.value,
          topK: 3,
          includeDriftstones: includeDriftstones.value,
          driftstoneSkillIds: DRIFTSTONE_SKILL_IDS,
          lockedArmor,
        },
        equipmentStore.armor,
        skillMap,
      )
      results.value = result.builds
      searchedCombos.value = result.searchedCombos
      elapsedMs.value = result.elapsedMs
      hasRun.value = true

      // Auto-apply the best result
      const best = result.builds[0]
      if (best) {
        applyResult(best)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '搜尋時發生錯誤'
    } finally {
      isRunning.value = false
    }
  }

  // ── Apply result to build store ──────────────────────────────────────────
  function applyResult(result: BuildResult) {
    // Only update unlocked armor slots (weapon is not managed by auto-build)
    if (!lockedSlots.value.has('head'))   buildStore.setSlot('head',   result.armor.head)
    if (!lockedSlots.value.has('chest'))  buildStore.setSlot('chest',  result.armor.chest)
    if (!lockedSlots.value.has('arms'))   buildStore.setSlot('arms',   result.armor.arms)
    if (!lockedSlots.value.has('waist'))  buildStore.setSlot('waist',  result.armor.waist)
    if (!lockedSlots.value.has('legs'))   buildStore.setSlot('legs',   result.armor.legs)

    // Apply driftstone assignments for unlocked armor slots
    if (result.driftstoneAssignments) {
      const SLOTS = ['head', 'chest', 'arms', 'waist', 'legs'] as const
      for (const slot of SLOTS) {
        if (lockedSlots.value.has(slot)) continue
        const assignments = result.driftstoneAssignments[slot]
        if (!assignments) continue
        for (let i = 0; i < assignments.length; i++) {
          buildStore.setDriftstoneSkill(slot, i, assignments[i] ?? null)
        }
      }
    }

    appliedRank.value = result.rank
  }

  return {
    // Input state
    targetSkills,
    includeDriftstones,
    // Output state
    results,
    isRunning,
    hasRun,
    searchedCombos,
    elapsedMs,
    error,
    appliedRank,
    // Lock state
    lockedSlots,
    toggleLock,
    isLocked,
    // Actions
    addTargetSkill,
    removeTargetSkill,
    updateTargetSkillLevel,
    clearTargets,
    resetSearch,
    run,
    applyResult,
  }
})

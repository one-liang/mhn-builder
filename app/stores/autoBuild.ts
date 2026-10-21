import { defineStore } from 'pinia'
import { useEquipmentStore } from './equipment'
import { useSkillStore } from './skill'
import { useBuildStore } from './build'
import type { ArmorSlot, BuildSlot } from './build'
import { runAutoBuild } from '~/lib/autoBuildAlgorithm'
import type { AutoBuildRequest, AutoBuildResult, SkillRecord, TargetSkill, BuildResult } from '~/lib/autoBuildAlgorithm'
import type { AutoBuildWorkerInput } from '~/lib/autoBuild.worker'
import type { Armor } from './equipment'
import driftstoneData from '../../data/driftstone-skills.json'

const DRIFTSTONE_SKILL_IDS = new Set(driftstoneData.achievableSkillIds)
const ARMOR_SLOTS: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']
const BUILD_SLOTS: BuildSlot[] = ['weapon', ...ARMOR_SLOTS]

// Search settings survive reloads; they are not part of share links.
const SETTINGS_KEY = 'mhn-builder-auto-build'

interface SavedSettings {
  targetSkills?: TargetSkill[]
  includeDriftstones?: boolean
  weaponType?: string | null
  lockedSlots?: BuildSlot[]
}

export type { TargetSkill, BuildResult }

export const useAutoBuildStore = defineStore('autoBuild', () => {
  const equipmentStore = useEquipmentStore()
  const skillStore = useSkillStore()
  const buildStore = useBuildStore()

  // ── Input state ──────────────────────────────────────────────────────────
  const targetSkills = ref<TargetSkill[]>([])
  const includeDriftstones = ref(true)
  const weaponType = ref<string | null>(null)

  // ── Output state ─────────────────────────────────────────────────────────
  const results = ref<BuildResult[]>([])
  const isRunning = ref(false)
  const hasRun = ref(false)
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

  /** A locked weapon slot keeps the equipped weapon; locked and empty means no weapon. */
  const weaponLocked = computed(() => lockedSlots.value.has('weapon'))

  /** The search needs a weapon type unless the weapon slot is locked. */
  const needsWeaponType = computed(() => !weaponLocked.value && !weaponType.value)

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

  // ── Settings persistence ─────────────────────────────────────────────────
  let settingsWatched = false

  /** Restore saved search settings; call once on the client after hydration. */
  function restoreSettings() {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY)
      const saved: SavedSettings = raw ? JSON.parse(raw) : {}
      if (Array.isArray(saved.targetSkills)) {
        targetSkills.value = saved.targetSkills
          .filter(t => skillStore.getById(t.skillId))
          .slice(0, 6)
      }
      if (typeof saved.includeDriftstones === 'boolean') includeDriftstones.value = saved.includeDriftstones
      if (typeof saved.weaponType === 'string' && equipmentStore.weapons[saved.weaponType]) {
        weaponType.value = saved.weaponType
      }
      if (Array.isArray(saved.lockedSlots)) {
        lockedSlots.value = new Set(saved.lockedSlots.filter(s => BUILD_SLOTS.includes(s)))
      }
    } catch {
      // Unreadable settings: start fresh
    }
    // Default the weapon type to the equipped weapon's
    if (!weaponType.value && buildStore.weapon) weaponType.value = buildStore.weapon.type

    if (!settingsWatched) {
      settingsWatched = true
      watch([targetSkills, includeDriftstones, weaponType, lockedSlots], saveSettings, { deep: true })
    }
  }

  function saveSettings() {
    try {
      const settings: SavedSettings = {
        targetSkills: targetSkills.value,
        includeDriftstones: includeDriftstones.value,
        weaponType: weaponType.value,
        lockedSlots: [...lockedSlots.value],
      }
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      // Storage full or blocked: settings just won't persist
    }
  }

  // ── Run algorithm ────────────────────────────────────────────────────────
  let worker: Worker | null = null
  let runId = 0

  function buildRequest(): AutoBuildRequest {
    const lockedArmor: Partial<Record<ArmorSlot, Armor>> = {}
    for (const p of ARMOR_SLOTS) {
      if (lockedSlots.value.has(p) && buildStore[p]) lockedArmor[p] = toRaw(buildStore[p]!)
    }
    const request: AutoBuildRequest = {
      targetSkills: targetSkills.value.map(t => ({ ...t })),
      topK: 3,
      includeDriftstones: includeDriftstones.value,
      driftstoneSkillIds: DRIFTSTONE_SKILL_IDS,
      lockedArmor,
    }
    if (weaponLocked.value) {
      if (buildStore.weapon) request.lockedWeapon = toRaw(buildStore.weapon)
    } else if (weaponType.value) {
      request.weapons = toRaw(equipmentStore.getWeaponsByType(weaponType.value))
    }
    return request
  }

  /** Run the search in a worker; falls back to the main thread where workers are unavailable. */
  function search(input: AutoBuildWorkerInput): Promise<AutoBuildResult> {
    if (typeof Worker === 'undefined') {
      return Promise.resolve(runAutoBuild(input.request, input.armor, new Map(input.skills)))
    }
    return new Promise((resolve, reject) => {
      worker = new Worker(new URL('../lib/autoBuild.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<AutoBuildResult>) => resolve(e.data)
      worker.onerror = (e) => reject(new Error(e.message || '搜尋時發生錯誤'))
      worker.postMessage(input)
    })
  }

  function stopWorker() {
    worker?.terminate()
    worker = null
  }

  /** Swap the worker's copies for the store's own objects so identity checks keep working. */
  function adopt(build: BuildResult): BuildResult {
    const weapon = build.weapon
      ? equipmentStore.getWeaponById(build.weapon.type, build.weapon.id) ?? build.weapon
      : null
    const armor = { ...build.armor }
    for (const p of ARMOR_SLOTS) {
      const piece = armor[p]
      if (piece) armor[p] = equipmentStore.getArmorByPart(p).find(a => a.id === piece.id) ?? piece
    }
    return { ...build, weapon, armor }
  }

  async function run() {
    if (targetSkills.value.length === 0) {
      error.value = '請至少新增一項目標技能'
      return
    }
    if (needsWeaponType.value) {
      error.value = '請先選擇武器類型'
      return
    }
    error.value = null
    isRunning.value = true
    const id = ++runId

    try {
      // Ensure data is loaded
      await Promise.all([equipmentStore.load(), skillStore.load()])

      const skills = skillStore.skills.map((s): [string, SkillRecord] => [
        s.id,
        { id: s.id, maxLevel: s.maxLevel, name: s.name },
      ])
      const result = await search({
        request: buildRequest(),
        armor: toRaw(equipmentStore.armor),
        skills,
      })
      if (id !== runId) return  // cancelled or superseded

      results.value = result.builds.map(adopt)
      hasRun.value = true

      // Auto-apply the best result
      const best = results.value[0]
      if (best) {
        applyResult(best)
      }
    } catch (e) {
      if (id === runId) error.value = e instanceof Error ? e.message : '搜尋時發生錯誤'
    } finally {
      if (id === runId) {
        stopWorker()
        isRunning.value = false
      }
    }
  }

  function cancel() {
    if (!isRunning.value) return
    runId++
    stopWorker()
    isRunning.value = false
  }

  // ── Apply result to build store ──────────────────────────────────────────
  function applyResult(result: BuildResult) {
    if (!lockedSlots.value.has('weapon') && result.weapon) buildStore.setSlot('weapon', result.weapon)
    for (const slot of ARMOR_SLOTS) {
      if (!lockedSlots.value.has(slot)) buildStore.setSlot(slot, result.armor[slot])
    }

    // Apply driftstone assignments for unlocked armor slots. Without assignments
    // (driftstones off) the player's own driftstones stay, trimmed to the new slots.
    if (result.driftstoneAssignments) {
      for (const slot of ARMOR_SLOTS) {
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
    weaponType,
    weaponLocked,
    needsWeaponType,
    // Output state
    results,
    isRunning,
    hasRun,
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
    restoreSettings,
    run,
    cancel,
    applyResult,
  }
})

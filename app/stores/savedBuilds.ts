import { defineStore } from 'pinia'
import {
  SAVED_BUILDS_LIMIT,
  mergeImported,
  newBuildId,
  parseExportFile,
  parseStoredBuilds,
  staleParts,
  toExportFile,
  type SavedBuild,
} from '~/lib/savedBuilds'
import { useEquipmentStore } from './equipment'
import driftstoneData from '../../data/driftstone-skills.json'

const STORAGE_KEY = 'mhn-builder-saved-builds'
const DRIFTSTONE_SKILL_IDS = new Set(driftstoneData.achievableSkillIds)

export type { SavedBuild }

/**
 * "我的配裝": named builds kept in this browser's localStorage. Changes show at once
 * (optimistic) and are written straight after; a failed write is reported through
 * `storageError` and the list keeps what the player sees.
 */
export const useSavedBuildsStore = defineStore('savedBuilds', () => {
  const equipmentStore = useEquipmentStore()

  const builds = ref<SavedBuild[]>([])
  const loaded = ref(false)
  const storageError = ref<string | null>(null)

  const isFull = computed(() => builds.value.length >= SAVED_BUILDS_LIMIT)

  /** Read storage once on the client (pages are prerendered without it). */
  function load() {
    if (loaded.value || typeof window === 'undefined') return
    try {
      builds.value = parseStoredBuilds(window.localStorage.getItem(STORAGE_KEY))
    } catch {
      builds.value = []
    }
    loaded.value = true
  }

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(builds.value))
      storageError.value = null
    } catch {
      storageError.value = '無法寫入瀏覽器儲存空間，配裝可能沒有存下來'
    }
  }

  /** Save params under a name; returns the new build, or null at the limit. */
  function add(name: string, params: Record<string, string>): SavedBuild | null {
    load()
    if (isFull.value) return null
    const now = Date.now()
    const build: SavedBuild = { id: newBuildId(), name: name.trim() || '未命名配裝', createdAt: now, updatedAt: now, params: { ...params } }
    builds.value = [build, ...builds.value]
    persist()
    return build
  }

  function rename(id: string, name: string) {
    const b = builds.value.find(x => x.id === id)
    const trimmed = name.trim().slice(0, 40)
    if (!b || !trimmed || trimmed === b.name) return
    builds.value = builds.value.map(x => (x.id === id ? { ...x, name: trimmed, updatedAt: Date.now() } : x))
    persist()
  }

  /** Remove a build; returns an undo that puts it back where it was. */
  function remove(id: string): (() => void) | null {
    const index = builds.value.findIndex(x => x.id === id)
    if (index === -1) return null
    const removed = builds.value[index]!
    builds.value = builds.value.filter(x => x.id !== id)
    persist()
    return () => {
      if (builds.value.some(x => x.id === removed.id)) return
      const next = [...builds.value]
      next.splice(Math.min(index, next.length), 0, removed)
      builds.value = next
      persist()
    }
  }

  function exportJson(): string {
    return JSON.stringify(toExportFile(builds.value), null, 2)
  }

  /** Merge a backup file's builds in; throws with a player-facing message on a bad file. */
  function importJson(text: string) {
    load()
    const result = mergeImported(builds.value, parseExportFile(text))
    builds.value = result.builds
    persist()
    return result
  }

  /** Parts of a saved build that no longer load as saved (needs equipment data loaded). */
  function stalePartsOf(build: SavedBuild): string[] {
    if (!equipmentStore.loaded) return []
    const weaponIds = new Set(Object.values(equipmentStore.weapons).flat().map(w => w.id))
    return staleParts(build.params, {
      hasWeapon: id => weaponIds.has(id),
      armorSlots: (part, id) => equipmentStore.getArmorByPart(part).find(a => a.id === id)?.driftstoneSlots,
      isDriftstoneSkill: id => DRIFTSTONE_SKILL_IDS.has(id),
    })
  }

  return { builds, loaded, storageError, isFull, load, add, rename, remove, exportJson, importJson, stalePartsOf }
})

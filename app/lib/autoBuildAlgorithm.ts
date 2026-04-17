/**
 * Auto-Build Algorithm — pure TypeScript, no Vue/Pinia dependencies.
 *
 * Strategy: K=8 greedy filter + full enumerate
 * 1. For each armor slot, keep pieces that contribute to target skills (top-K=8 by score).
 * 2. Enumerate all K^5 armor combinations (~32,768 max).
 * 3. For each combination, score using coverage/shortage/overflow weights.
 *    Optionally greedy-assign driftstone slots to maximize target skill coverage.
 * 4. Return top-N builds.
 */

import type { Armor, Weapon } from '~/stores/equipment'
import type { SkillSummaryEntry } from '~/stores/build'

// ── Types ───────────────────────────────────────────────────────────────────

export interface TargetSkill {
  skillId: string
  desiredLevel: number
}

export interface AutoBuildRequest {
  targetSkills: TargetSkill[]
  weaponType?: string          // '' or undefined = any type
  weaponId?: string           // if set, pin this specific weapon
  topK?: number               // number of results to return (default 3)
  includeDriftstones?: boolean // if true, optimally assign driftstone slots
  driftstoneSkillIds?: Set<string> // skill IDs achievable via driftstone; non-members get boosted scoring weight
}

export interface BuildResult {
  rank: number
  score: number
  coveragePercent: number  // 0-100, % of desired skill levels met (capped)
  weapon: Weapon | null
  armor: {
    head: Armor | null
    chest: Armor | null
    arms: Armor | null
    waist: Armor | null
    legs: Armor | null
  }
  skillSummary: SkillSummaryEntry[]
  unmetSkills: { skillId: string; name: string; missing: number }[]
  totalDefense: number
  driftstoneAssignments?: Record<ArmorPart, (string | null)[]>
}

export interface AutoBuildResult {
  builds: BuildResult[]
  searchedCombos: number
  elapsedMs: number
}

interface SkillRecord {
  id: string
  maxLevel: number
  name: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const CANDIDATE_K = 8          // max armor candidates per slot
const WEAPON_K = 5             // max weapon candidates
const WEIGHT_MET = 100         // score per met desired level (driftstone-achievable skills)
const WEIGHT_MET_RARE = 300    // score per met desired level (non-driftstone skills — force armor coverage)
const WEIGHT_MISS = 60         // penalty per missing desired level
const WEIGHT_OVERFLOW = 8      // penalty per wasted level (above maxLevel)
const ARMOR_PARTS = ['head', 'chest', 'arms', 'waist', 'legs'] as const
type ArmorPart = typeof ARMOR_PARTS[number]

// ── Skill ID normalizer ──────────────────────────────────────────────────────

/** Normalize skill IDs: weapon data uses underscores, skills.json uses hyphens */
function normalizeId(id: string): string {
  return id.replace(/_/g, '-')
}

// ── Candidate selection ──────────────────────────────────────────────────────

function armorContributionScore(piece: Armor, targetSkills: TargetSkill[], remaining: Map<string, number>): number {
  let score = 0
  for (const s of piece.skills) {
    const nid = normalizeId(s.skillId)
    const needed = remaining.get(nid)
    if (needed !== undefined && needed > 0) {
      score += Math.min(s.level, needed)
    }
  }
  return score
}

export function selectArmorCandidates(
  part: ArmorPart,
  pieces: Armor[],
  targetSkills: TargetSkill[],
): Armor[] {
  const remaining = new Map<string, number>()
  for (const t of targetSkills) {
    remaining.set(normalizeId(t.skillId), t.desiredLevel)
  }

  // Separate pieces with target-skill contribution vs no contribution
  const withSkill: { piece: Armor; score: number }[] = []
  const withoutSkill: Armor[] = []

  for (const piece of pieces) {
    const score = armorContributionScore(piece, targetSkills, remaining)
    if (score > 0) {
      withSkill.push({ piece, score })
    } else {
      withoutSkill.push(piece)
    }
  }

  // Sort skill-contributing pieces by score desc, then defense desc
  withSkill.sort((a, b) => b.score - a.score || b.piece.defense - a.piece.defense)

  const candidates: Armor[] = withSkill.slice(0, CANDIDATE_K).map(x => x.piece)

  // If we still have room, fill with highest-defense pieces (fallback)
  if (candidates.length < CANDIDATE_K) {
    withoutSkill.sort((a, b) => b.defense - a.defense)
    const needed = CANDIDATE_K - candidates.length
    candidates.push(...withoutSkill.slice(0, needed))
  }

  // Guarantee representation: for each target skill, ensure at least one candidate
  // has that skill. Without this, a rare skill (e.g. only on 1 armor piece) can be
  // crowded out when K slots are filled by higher-scoring pieces for other skills.
  for (const t of targetSkills) {
    const nid = normalizeId(t.skillId)
    const represented = candidates.some(p =>
      p.skills.some(s => normalizeId(s.skillId) === nid)
    )
    if (!represented) {
      const best = pieces
        .filter(p => p.skills.some(s => normalizeId(s.skillId) === nid))
        .sort((a, b) => {
          const la = a.skills.find(s => normalizeId(s.skillId) === nid)?.level ?? 0
          const lb = b.skills.find(s => normalizeId(s.skillId) === nid)?.level ?? 0
          return lb - la || b.defense - a.defense
        })[0]
      if (best) {
        if (candidates.length >= CANDIDATE_K) {
          candidates[candidates.length - 1] = best  // Replace lowest-priority
        } else {
          candidates.push(best)
        }
      }
    }
  }

  return candidates
}

function weaponContributionScore(weapon: Weapon, targetSkills: TargetSkill[]): number {
  let score = 0
  for (const s of weapon.skills) {
    const nid = normalizeId(s.skillId)
    const target = targetSkills.find(t => normalizeId(t.skillId) === nid)
    if (target) score += Math.min(s.level, target.desiredLevel)
  }
  return score
}

export function selectWeaponCandidates(
  allWeapons: Record<string, Weapon[]>,
  request: AutoBuildRequest,
): Weapon[] {
  // Pin a specific weapon
  if (request.weaponId) {
    for (const list of Object.values(allWeapons)) {
      const found = list.find(w => w.id === request.weaponId)
      if (found) return [found]
    }
  }

  // Build candidate pool from requested type(s)
  const pool: Weapon[] = []
  if (request.weaponType) {
    pool.push(...(allWeapons[request.weaponType] ?? []))
  } else {
    for (const list of Object.values(allWeapons)) {
      pool.push(...list)
    }
  }

  // Sort: skill contribution desc, then attack desc
  const scored = pool.map(w => ({
    weapon: w,
    score: weaponContributionScore(w, request.targetSkills),
  }))
  scored.sort((a, b) => b.score - a.score || b.weapon.attack - a.weapon.attack)

  // Take top-K, but include at least one weapon even if no skill contribution
  const topK = scored.slice(0, WEAPON_K).map(x => x.weapon)
  if (topK.length === 0 && pool.length > 0) {
    const best = pool.sort((a, b) => b.attack - a.attack)[0]
    if (best) topK.push(best)
  }
  return topK
}

// ── Driftstone greedy assignment ─────────────────────────────────────────────

/**
 * Greedily assign driftstone slots to target skills.
 * Each slot is filled with the target skill that has the highest remaining shortage.
 * Only assigns skills that are in `achievableIds` (real driftstone skills).
 * Mutates `runningTotals` in-place (pass a Map copy if you need to preserve the original).
 */
function assignDriftstones(
  armor: Record<ArmorPart, Armor | null>,
  targetSkills: TargetSkill[],
  runningTotals: Map<string, number>,
  skillMap: Map<string, SkillRecord>,
  achievableIds: Set<string>,
): Record<ArmorPart, (string | null)[]> {
  const assignments: Record<ArmorPart, (string | null)[]> = {
    head: [], chest: [], arms: [], waist: [], legs: [],
  }

  for (const part of ARMOR_PARTS) {
    const piece = armor[part]
    if (!piece || piece.driftstoneSlots === 0) continue

    for (let i = 0; i < piece.driftstoneSlots; i++) {
      let bestSkill: string | null = null
      let bestShortage = 0

      for (const t of targetSkills) {
        const nid = normalizeId(t.skillId)
        if (!achievableIds.has(nid)) continue  // only assign driftstone-achievable skills
        const maxLv = skillMap.get(nid)?.maxLevel ?? t.desiredLevel
        const shortage = Math.max(0, Math.min(t.desiredLevel, maxLv) - (runningTotals.get(nid) ?? 0))
        if (shortage > bestShortage) {
          bestShortage = shortage
          bestSkill = nid
        }
      }

      assignments[part].push(bestSkill)
      if (bestSkill) {
        runningTotals.set(bestSkill, (runningTotals.get(bestSkill) ?? 0) + 1)
      }
    }
  }

  return assignments
}

// ── Combo evaluation ──────────────────────────────────────────────────────────

function aggregateSkills(
  weapon: Weapon | null,
  armor: Record<ArmorPart, Armor | null>,
): Map<string, number> {
  const totals = new Map<string, number>()
  const add = (skillId: string, level: number) => {
    const nid = normalizeId(skillId)
    totals.set(nid, (totals.get(nid) ?? 0) + level)
  }

  if (weapon) {
    for (const s of weapon.skills) add(s.skillId, s.level)
  }
  for (const part of ARMOR_PARTS) {
    const piece = armor[part]
    if (piece) {
      for (const s of piece.skills) add(s.skillId, s.level)
    }
  }
  return totals
}

interface EvalResult {
  score: number
  totals: Map<string, number>
  driftstoneAssignments: Record<ArmorPart, (string | null)[]> | undefined
}

function evaluateCombo(
  weapon: Weapon | null,
  armor: Record<ArmorPart, Armor | null>,
  targetSkills: TargetSkill[],
  skillMap: Map<string, SkillRecord>,
  includeDriftstones: boolean,
  driftstoneSkillIds: Set<string>,
): EvalResult {
  const baseTotals = aggregateSkills(weapon, armor)

  let totals: Map<string, number>
  let driftstoneAssignments: Record<ArmorPart, (string | null)[]> | undefined

  if (includeDriftstones) {
    totals = new Map(baseTotals)  // copy so assignDriftstones can mutate freely
    driftstoneAssignments = assignDriftstones(armor, targetSkills, totals, skillMap, driftstoneSkillIds)
  } else {
    totals = baseTotals
  }

  let score = 0
  for (const { skillId, desiredLevel } of targetSkills) {
    const nid = normalizeId(skillId)
    const skillDef = skillMap.get(nid)
    const maxLv = skillDef?.maxLevel ?? desiredLevel
    const raw = totals.get(nid) ?? 0
    const capped = Math.min(raw, maxLv)

    // Non-driftstone skills get a higher met-weight to force armor coverage when driftstones disabled.
    // When driftstones are enabled, they can cover any skill, so standard weight applies.
    const metWeight = (!includeDriftstones && !driftstoneSkillIds.has(nid)) ? WEIGHT_MET_RARE : WEIGHT_MET

    score += Math.min(capped, desiredLevel) * metWeight
    score -= Math.max(0, desiredLevel - capped) * WEIGHT_MISS
    score -= Math.max(0, raw - maxLv) * WEIGHT_OVERFLOW
  }

  // Defense tiebreaker
  let totalDefense = 0
  for (const part of ARMOR_PARTS) {
    totalDefense += armor[part]?.defense ?? 0
  }
  score += totalDefense * 0.005

  return { score, totals, driftstoneAssignments }
}

function buildSkillSummaryFromTotals(
  totals: Map<string, number>,
  skillMap: Map<string, SkillRecord>,
): SkillSummaryEntry[] {
  const entries: SkillSummaryEntry[] = []

  for (const [id, rawTotal] of totals) {
    const skillDef = skillMap.get(id)
    const maxLevel = skillDef?.maxLevel ?? rawTotal
    entries.push({
      id,
      name: skillDef?.name ?? id,
      total: rawTotal,
      max: maxLevel,
      overflow: rawTotal > maxLevel,
    })
  }

  entries.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  return entries
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

export function runAutoBuild(
  request: AutoBuildRequest,
  allArmor: Record<ArmorPart, Armor[]>,
  allWeapons: Record<string, Weapon[]>,
  skillMap: Map<string, SkillRecord>,
): AutoBuildResult {
  const t0 = performance.now()
  const topN = request.topK ?? 3
  const includeDriftstones = request.includeDriftstones ?? false
  const driftstoneSkillIds = request.driftstoneSkillIds ?? new Set<string>()

  // Pre-select candidates
  const weaponCandidates = selectWeaponCandidates(allWeapons, request)
  const armorCandidates: Record<ArmorPart, Armor[]> = {
    head: selectArmorCandidates('head', allArmor.head, request.targetSkills),
    chest: selectArmorCandidates('chest', allArmor.chest, request.targetSkills),
    arms: selectArmorCandidates('arms', allArmor.arms, request.targetSkills),
    waist: selectArmorCandidates('waist', allArmor.waist, request.targetSkills),
    legs: selectArmorCandidates('legs', allArmor.legs, request.targetSkills),
  }

  // Enumerate all combinations
  let searchedCombos = 0
  const topBuilds: { score: number; result: Omit<BuildResult, 'rank'> }[] = []
  let minTopScore = -Infinity

  for (const weapon of weaponCandidates) {
    for (const head of armorCandidates.head) {
      for (const chest of armorCandidates.chest) {
        for (const arms of armorCandidates.arms) {
          for (const waist of armorCandidates.waist) {
            for (const legs of armorCandidates.legs) {
              searchedCombos++
              const armorMap = { head, chest, arms, waist, legs }
              const { score, totals, driftstoneAssignments } = evaluateCombo(
                weapon, armorMap, request.targetSkills, skillMap, includeDriftstones, driftstoneSkillIds,
              )

              if (topBuilds.length < topN || score > minTopScore) {
                const unmetSkills = request.targetSkills
                  .filter(t => {
                    const nid = normalizeId(t.skillId)
                    const skillDef = skillMap.get(nid)
                    const maxLv = skillDef?.maxLevel ?? t.desiredLevel
                    const raw = totals.get(nid) ?? 0
                    const capped = Math.min(raw, maxLv)
                    return capped < t.desiredLevel
                  })
                  .map(t => {
                    const nid = normalizeId(t.skillId)
                    const skillDef = skillMap.get(nid)
                    const maxLv = skillDef?.maxLevel ?? t.desiredLevel
                    const raw = totals.get(nid) ?? 0
                    const capped = Math.min(raw, maxLv)
                    return {
                      skillId: nid,
                      name: skillDef?.name ?? nid,
                      missing: t.desiredLevel - capped,
                    }
                  })

                const totalDefense = ARMOR_PARTS.reduce((sum, p) => sum + (armorMap[p]?.defense ?? 0), 0)

                // Compute coverage %
                const totalDesired = request.targetSkills.reduce((sum, t) => sum + t.desiredLevel, 0)
                const totalMet = request.targetSkills.reduce((sum, t) => {
                  const nid = normalizeId(t.skillId)
                  const skillDef = skillMap.get(nid)
                  const maxLv = skillDef?.maxLevel ?? t.desiredLevel
                  const raw = totals.get(nid) ?? 0
                  const capped = Math.min(raw, maxLv)
                  return sum + Math.min(capped, t.desiredLevel)
                }, 0)
                const coveragePercent = totalDesired > 0 ? Math.round((totalMet / totalDesired) * 100) : 100

                const entry = {
                  score,
                  result: {
                    score,
                    coveragePercent,
                    weapon,
                    armor: armorMap,
                    skillSummary: buildSkillSummaryFromTotals(totals, skillMap),
                    unmetSkills,
                    totalDefense,
                    driftstoneAssignments,
                  },
                }

                if (topBuilds.length < topN) {
                  topBuilds.push(entry)
                  topBuilds.sort((a, b) => b.score - a.score)
                  minTopScore = topBuilds.at(-1)!.score
                } else {
                  // Replace lowest
                  topBuilds[topBuilds.length - 1] = entry
                  topBuilds.sort((a, b) => b.score - a.score)
                  minTopScore = topBuilds.at(-1)!.score
                }
              }
            }
          }
        }
      }
    }
  }

  const builds: BuildResult[] = topBuilds.map((b, i) => ({
    rank: i + 1,
    ...b.result,
  }))

  return {
    builds,
    searchedCombos,
    elapsedMs: Math.round(performance.now() - t0),
  }
}

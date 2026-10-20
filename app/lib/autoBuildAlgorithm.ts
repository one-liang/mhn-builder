/**
 * Auto-Build Algorithm — pure TypeScript, no Vue/Pinia dependencies.
 *
 * Strategy: K=8 greedy filter + full enumerate
 * 1. For each armor slot and for the weapon, keep pieces that contribute to target
 *    skills (top-K=8 by score). A locked slot keeps its one piece.
 * 2. Enumerate every weapon × armor combination (K^6 ≈ 262k at most).
 * 3. For each combination, score using coverage/shortage/overflow weights.
 *    Optionally greedy-assign driftstone slots to maximize target skill coverage.
 * 4. Return top-N builds, ranked by skill score, then attack, then defense.
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
  topK?: number               // number of results to return (default 3)
  includeDriftstones?: boolean // if true, optimally assign driftstone slots
  driftstoneSkillIds?: Set<string> // skill IDs achievable via driftstone; non-members get boosted scoring weight
  lockedArmor?: Partial<Record<ArmorPart, Armor>> // locked armor pieces to use as-is
  weapons?: Weapon[]          // weapons to choose from (usually one weapon type)
  lockedWeapon?: Weapon       // locked weapon to use as-is; overrides `weapons`
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
}

export interface SkillRecord {
  id: string
  maxLevel: number
  name: string
}

interface Piece {
  id: string
  skills: { skillId: string; level: number }[]
}

// ── Constants ───────────────────────────────────────────────────────────────

const CANDIDATE_K = 8          // max candidates per slot (armor and weapon alike)
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

/**
 * Score a piece by how much it contributes toward target skills.
 * When driftstoneSkillIds is provided (i.e. driftstones are enabled), skills
 * that CANNOT be achieved via driftstone get 3× weight so the candidate
 * selector strongly prefers pieces that cover those rare skills.
 */
function contributionScore(
  piece: Piece,
  remaining: Map<string, number>,
  driftstoneSkillIds?: Set<string>,
): number {
  let score = 0
  for (const s of piece.skills) {
    const nid = normalizeId(s.skillId)
    const needed = remaining.get(nid)
    if (needed !== undefined && needed > 0) {
      const contribution = Math.min(s.level, needed)
      // Non-driftstone skills MUST come from gear — weight them 3× so they
      // aren't crowded out by common driftstone-achievable skills in the top-K.
      const weight = (driftstoneSkillIds && !driftstoneSkillIds.has(nid)) ? 3 : 1
      score += contribution * weight
    }
  }
  return score
}

/**
 * Keep the K pieces that contribute most to the target skills; `strength` breaks
 * ties (defense for armor, attack for weapons) and picks the filler when fewer
 * than K pieces contribute anything.
 */
function selectCandidates<T extends Piece>(
  pieces: T[],
  targetSkills: TargetSkill[],
  strength: (piece: T) => number,
  driftstoneSkillIds?: Set<string>,
): T[] {
  const remaining = new Map<string, number>()
  for (const t of targetSkills) {
    remaining.set(normalizeId(t.skillId), t.desiredLevel)
  }

  // Separate pieces with target-skill contribution vs no contribution
  const withSkill: { piece: T; score: number }[] = []
  const withoutSkill: T[] = []

  for (const piece of pieces) {
    const score = contributionScore(piece, remaining, driftstoneSkillIds)
    if (score > 0) {
      withSkill.push({ piece, score })
    } else {
      withoutSkill.push(piece)
    }
  }

  withSkill.sort((a, b) => b.score - a.score || strength(b.piece) - strength(a.piece))

  const candidates: T[] = withSkill.slice(0, CANDIDATE_K).map(x => x.piece)

  // If we still have room, fill with the strongest pieces (fallback)
  if (candidates.length < CANDIDATE_K) {
    withoutSkill.sort((a, b) => strength(b) - strength(a))
    const needed = CANDIDATE_K - candidates.length
    candidates.push(...withoutSkill.slice(0, needed))
  }

  // Guarantee representation: for each target skill, ensure at least one candidate
  // has that skill. Without this, a rare skill (e.g. only on 1 armor piece) can be
  // crowded out when K slots are filled by higher-scoring pieces for other skills.
  //
  // IMPORTANT: always push a new slot — never replace a previous guarantee.
  // If we replaced candidates[last] each time, only the final skill's piece would
  // survive, leaving earlier rare skills completely unrepresented.
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
          return lb - la || strength(b) - strength(a)
        })[0]
      if (best && !candidates.some(c => c.id === best.id)) {
        candidates.push(best)  // Always add a new slot — never overwrite
      }
    }
  }

  return candidates
}

export function selectArmorCandidates(
  _part: ArmorPart,
  pieces: Armor[],
  targetSkills: TargetSkill[],
  driftstoneSkillIds?: Set<string>,
): Armor[] {
  return selectCandidates(pieces, targetSkills, a => a.defense, driftstoneSkillIds)
}

export function selectWeaponCandidates(
  weapons: Weapon[],
  targetSkills: TargetSkill[],
  driftstoneSkillIds?: Set<string>,
): Weapon[] {
  return selectCandidates(weapons, targetSkills, w => w.attack, driftstoneSkillIds)
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

    // Non-driftstone skills MUST come from gear regardless of whether driftstones
    // are enabled — driftstones cannot cover them, so always use the higher weight
    // to force the algorithm to seek pieces that provide those skills.
    const metWeight = !driftstoneSkillIds.has(nid) ? WEIGHT_MET_RARE : WEIGHT_MET

    score += Math.min(capped, desiredLevel) * metWeight
    score -= Math.max(0, desiredLevel - capped) * WEIGHT_MISS
    score -= Math.max(0, raw - maxLv) * WEIGHT_OVERFLOW
  }

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

/** Levels of a target skill that count, after the skill's max level cap. */
function cappedLevel(t: TargetSkill, totals: Map<string, number>, skillMap: Map<string, SkillRecord>): number {
  const nid = normalizeId(t.skillId)
  const maxLv = skillMap.get(nid)?.maxLevel ?? t.desiredLevel
  return Math.min(totals.get(nid) ?? 0, maxLv)
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

interface RankKey {
  score: number
  attack: number
  defense: number
}

interface Ranked extends RankKey {
  result: Omit<BuildResult, 'rank'>
}

/** Skill score first; attack, then defense, only break ties. */
function compareRanked(a: RankKey, b: RankKey): number {
  return b.score - a.score || b.attack - a.attack || b.defense - a.defense
}

export function runAutoBuild(
  request: AutoBuildRequest,
  allArmor: Record<ArmorPart, Armor[]>,
  skillMap: Map<string, SkillRecord>,
): AutoBuildResult {
  const topN = request.topK ?? 3
  const includeDriftstones = request.includeDriftstones ?? false
  const driftstoneSkillIds = request.driftstoneSkillIds ?? new Set<string>()
  const { targetSkills } = request

  // Pass driftstoneSkillIds to candidate selection only when driftstones are enabled.
  // This lets candidate selection boost the score of non-driftstone skills
  // so they aren't crowded out by common driftstone-achievable skills.
  const candidateDriftstoneIds = includeDriftstones ? driftstoneSkillIds : undefined

  const armorCandidates = {} as Record<ArmorPart, Armor[]>
  for (const part of ARMOR_PARTS) {
    const locked = request.lockedArmor?.[part]
    armorCandidates[part] = locked
      ? [locked]
      : selectArmorCandidates(part, allArmor[part], targetSkills, candidateDriftstoneIds)
  }

  // No weapon pool → the weapon slot stays empty and only armor is searched
  const weaponCandidates: (Weapon | null)[] = request.lockedWeapon
    ? [request.lockedWeapon]
    : request.weapons?.length
      ? selectWeaponCandidates(request.weapons, targetSkills, candidateDriftstoneIds)
      : [null]

  const totalDesired = targetSkills.reduce((sum, t) => sum + t.desiredLevel, 0)

  // Enumerate all combinations
  let searchedCombos = 0
  const topBuilds: Ranked[] = []

  for (const weapon of weaponCandidates) {
    const attack = weapon?.attack ?? 0
    for (const head of armorCandidates.head) {
      for (const chest of armorCandidates.chest) {
        for (const arms of armorCandidates.arms) {
          for (const waist of armorCandidates.waist) {
            for (const legs of armorCandidates.legs) {
              searchedCombos++
              const armorMap = { head, chest, arms, waist, legs }
              const { score, totals, driftstoneAssignments } = evaluateCombo(
                weapon, armorMap, targetSkills, skillMap, includeDriftstones, driftstoneSkillIds,
              )
              const defense = head.defense + chest.defense + arms.defense + waist.defense + legs.defense
              const key = { score, attack, defense }

              if (topBuilds.length >= topN && compareRanked(key, topBuilds.at(-1)!) >= 0) continue

              const unmetSkills = targetSkills
                .filter(t => cappedLevel(t, totals, skillMap) < t.desiredLevel)
                .map(t => {
                  const nid = normalizeId(t.skillId)
                  return {
                    skillId: nid,
                    name: skillMap.get(nid)?.name ?? nid,
                    missing: t.desiredLevel - cappedLevel(t, totals, skillMap),
                  }
                })

              const totalMet = targetSkills.reduce(
                (sum, t) => sum + Math.min(cappedLevel(t, totals, skillMap), t.desiredLevel),
                0,
              )
              const coveragePercent = totalDesired > 0 ? Math.round((totalMet / totalDesired) * 100) : 100

              const entry: Ranked = {
                ...key,
                result: {
                  score,
                  coveragePercent,
                  weapon,
                  armor: armorMap,
                  skillSummary: buildSkillSummaryFromTotals(totals, skillMap),
                  unmetSkills,
                  totalDefense: defense,
                  driftstoneAssignments,
                },
              }

              if (topBuilds.length >= topN) topBuilds.pop()  // Replace lowest
              topBuilds.push(entry)
              topBuilds.sort(compareRanked)
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
  }
}

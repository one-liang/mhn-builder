// Runs the auto-build search off the main thread so the page keeps animating.
import { runAutoBuild } from './autoBuildAlgorithm'
import type { AutoBuildRequest, SkillRecord } from './autoBuildAlgorithm'
import type { Armor } from '~/stores/equipment'

export interface AutoBuildWorkerInput {
  request: AutoBuildRequest
  armor: Record<Armor['part'], Armor[]>
  skills: [string, SkillRecord][]
}

self.onmessage = (e: MessageEvent<AutoBuildWorkerInput>) => {
  const { request, armor, skills } = e.data
  self.postMessage(runAutoBuild(request, armor, new Map(skills)))
}

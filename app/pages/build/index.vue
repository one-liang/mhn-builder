<script setup lang="ts">
import { Check, Gem, Lock, LockOpen, Plus, Share2, Sparkles, Trash2, TriangleAlert, Zap } from 'lucide-vue-next'
import type { Armor, Weapon } from '~/stores/equipment'
import { getPartName } from '~/stores/equipment'
import { useBuildStore, type BuildSlot, type ArmorSlot } from '~/stores/build'
import { useSkillStore } from '~/stores/skill'
import { useAutoBuildStore } from '~/stores/autoBuild'

useSeoMeta({
  title: '配裝模擬器 | 最強獵人 - MHN 配裝模擬器',
  description: '自由搭配 MHN 武器、防具與漂流石，即時計算技能等級總量，儲存與分享你的最強配裝。',
  ogTitle: '配裝模擬器 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '自由搭配裝備，即時技能計算，一鍵分享你的最強獵人配裝。',
})

const route = useRoute()
const buildStore = useBuildStore()
const skillStore = useSkillStore()
const autoBuildStore = useAutoBuildStore()

const queryParams = computed(() => {
  const result: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string') result[key] = value
    else if (Array.isArray(value) && typeof value[0] === 'string') result[key] = value[0]
  }
  return result
})

await buildStore.hydrate(queryParams.value)

const selectorOpen = ref(false)
const activeSlot = ref<BuildSlot | null>(null)

function openSelector(slotType: BuildSlot) {
  activeSlot.value = slotType
  selectorOpen.value = true
}

function onSelect(item: Weapon | Armor | null, actualSlot?: string) {
  const targetSlot = (actualSlot as BuildSlot) ?? activeSlot.value
  if (!targetSlot) return
  buildStore.setSlot(targetSlot, item)
}

// Driftstone skill picker
const driftstonePickerOpen = ref(false)
const activeDriftstoneTarget = ref<{ armorSlot: ArmorSlot; slotIndex: number } | null>(null)

const activeDriftstoneSkill = computed(() => {
  const target = activeDriftstoneTarget.value
  if (!target) return null
  return buildStore.driftstoneSkills[target.armorSlot]?.[target.slotIndex] ?? null
})

function openDriftstoneSkill(armorSlot: ArmorSlot, idx: number) {
  activeDriftstoneTarget.value = { armorSlot, slotIndex: idx }
  driftstonePickerOpen.value = true
}

function onDriftstoneSkillSelect(skillId: string | null) {
  if (!activeDriftstoneTarget.value) return
  buildStore.setDriftstoneSkill(
    activeDriftstoneTarget.value.armorSlot,
    activeDriftstoneTarget.value.slotIndex,
    skillId
  )
}

function getDriftstoneSkillName(armorSlot: ArmorSlot, idx: number): string | null {
  const id = buildStore.driftstoneSkills[armorSlot]?.[idx]
  return id ? (skillStore.getById(id)?.name ?? id) : null
}

// Set of skill IDs that come from any driftstone slot (for summary attribution)
const driftstoneSkillIds = computed(() => {
  const ids = new Set<string>()
  for (const slot of (['head', 'chest', 'arms', 'waist', 'legs'] as ArmorSlot[])) {
    for (const skillId of buildStore.driftstoneSkills[slot]) {
      if (skillId) ids.add(skillId)
    }
  }
  return ids
})

const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2200)
}

async function shareBuild() {
  if (typeof window === 'undefined') return
  const url = buildStore.toShareUrl(window.location.origin)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
    } else {
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    showToast('已複製連結！')
  } catch {
    showToast('複製失敗，請手動複製網址列')
  }
}

function resetBuild() {
  buildStore.clearAll()
  showToast('已清除配裝')
}

function onAutoBuildSearchComplete() {
  nextTick(() => {
    document.getElementById('equipment-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const armorSlots: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']
const allSlots: BuildSlot[] = ['weapon', ...armorSlots]
const skillEntries = computed(() => buildStore.skillSummary)

const equippedCount = computed(() => allSlots.filter(s => buildStore[s]).length)

function lockLabel(slot: BuildSlot) {
  const name = slot === 'weapon' ? '武器' : getPartName(slot)
  return autoBuildStore.isLocked(slot) ? `解除鎖定${name}` : `鎖定${name}`
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-6xl">
    <PageHeader title="配裝模擬器" eyebrow="Build Simulator">
      <template #actions>
        <button
          v-if="!buildStore.isEmpty"
          type="button"
          class="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
          @click="resetBuild"
        >
          <Trash2 class="size-3.5" aria-hidden="true" />
          清除
        </button>
      </template>
    </PageHeader>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10">
      <!-- ── Left: auto build + equipment ── -->
      <div class="flex min-w-0 flex-col gap-6">
        <AutoBuildPanel @search-complete="onAutoBuildSearchComplete" />

        <section id="equipment-section" class="scroll-mt-20" aria-label="裝備">
          <SectionHeading index="01" title="裝備" en="Equipment">
            <span class="font-num text-sm tabular-nums text-muted-foreground">
              <span class="font-semibold text-foreground">{{ equippedCount }}</span>/6
            </span>
          </SectionHeading>

          <div class="flex flex-col gap-2">
            <div
              v-for="s in allSlots"
              :key="s"
              class="flex items-stretch gap-2"
            >
              <!-- Lock button -->
              <button
                type="button"
                class="flex w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors"
                :class="autoBuildStore.isLocked(s)
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground/60 hover:border-border-strong hover:text-foreground'"
                :aria-label="lockLabel(s)"
                :aria-pressed="autoBuildStore.isLocked(s)"
                @click="autoBuildStore.toggleLock(s)"
              >
                <Lock v-if="autoBuildStore.isLocked(s)" class="size-3.5" aria-hidden="true" />
                <LockOpen v-else class="size-3.5" aria-hidden="true" />
              </button>

              <BuildSlot
                class="min-w-0 flex-1"
                :slot-type="s"
                :item="buildStore[s]"
                @open="openSelector(s)"
              />

              <!-- Driftstone sockets (only when armor equipped AND has slots) -->
              <div
                v-if="s !== 'weapon' && buildStore[s] && (buildStore[s] as Armor).driftstoneSlots > 0"
                class="flex w-16 flex-shrink-0 flex-col gap-1"
              >
                <button
                  v-for="i in (buildStore[s] as Armor).driftstoneSlots"
                  :key="i"
                  type="button"
                  class="flex min-h-[30px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border px-1 transition-colors"
                  :class="getDriftstoneSkillName(s as ArmorSlot, i - 1)
                    ? 'border-stone/70 bg-stone-soft hover:border-stone'
                    : 'border-dashed border-border-strong text-muted-foreground hover:border-stone hover:text-stone'"
                  :title="getDriftstoneSkillName(s as ArmorSlot, i - 1) ?? '新增漂流石技能'"
                  :aria-label="`漂移槽 ${i}：${getDriftstoneSkillName(s as ArmorSlot, i - 1) ?? '空'}`"
                  @click="openDriftstoneSkill(s as ArmorSlot, i - 1)"
                >
                  <template v-if="getDriftstoneSkillName(s as ArmorSlot, i - 1)">
                    <Gem class="size-3 text-stone" aria-hidden="true" />
                    <span class="w-full truncate text-center text-[0.625rem] font-bold leading-tight text-foreground">
                      {{ getDriftstoneSkillName(s as ArmorSlot, i - 1) }}
                    </span>
                  </template>
                  <template v-else>
                    <Plus class="size-3.5" aria-hidden="true" />
                    <span v-if="(buildStore[s] as Armor).driftstoneSlots === 1" class="text-[0.625rem] font-medium leading-tight">漂流石</span>
                  </template>
                </button>
              </div>
            </div>
          </div>

          <p class="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <Lock class="size-3" aria-hidden="true" />
            鎖定的部位在自動配裝時會保留不動
          </p>
        </section>
      </div>

      <!-- ── Right: skill summary ── -->
      <aside class="min-w-0 lg:sticky lg:top-20 lg:self-start" aria-label="技能合計">
        <SectionHeading index="02" title="技能合計" en="Skills">
          <span v-if="skillEntries.length" class="font-num text-sm tabular-nums text-muted-foreground">
            <span class="font-semibold text-foreground">{{ skillEntries.length }}</span> 項
          </span>
        </SectionHeading>

        <div
          v-if="!skillEntries.length"
          class="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-strong px-6 py-10 text-center"
        >
          <Sparkles class="size-5 text-muted-foreground" aria-hidden="true" />
          <p class="text-sm font-medium text-foreground">尚未選擇裝備</p>
          <p class="text-xs text-muted-foreground">從裝備欄開始組合，或使用自動配裝</p>
        </div>

        <ul v-else class="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
          <li
            v-for="entry in skillEntries"
            :key="entry.id"
            class="flex items-center gap-3 px-3 py-2.5"
          >
            <!-- Hexagonal icon badge -->
            <div class="relative flex size-9 flex-shrink-0 items-center justify-center">
              <svg
                viewBox="0 0 46 46"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="absolute inset-0 size-full"
                :class="entry.overflow ? 'text-warning' : driftstoneSkillIds.has(entry.id) ? 'text-stone' : 'text-muted-foreground'"
                aria-hidden="true"
              >
                <polygon
                  points="23,2 42,12.5 42,33.5 23,44 4,33.5 4,12.5"
                  stroke="currentColor"
                  stroke-opacity="0.45"
                  stroke-width="1.5"
                  fill="currentColor"
                  fill-opacity="0.1"
                />
              </svg>
              <TriangleAlert v-if="entry.overflow" class="relative size-4 text-warning" aria-label="技能超過最高等級" />
              <Gem v-else-if="driftstoneSkillIds.has(entry.id)" class="relative size-4 text-stone" aria-label="含漂流石技能" />
              <Zap v-else class="relative size-4 text-muted-foreground" aria-hidden="true" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-baseline gap-2">
                <span
                  class="truncate text-sm font-medium"
                  :class="entry.overflow ? 'text-warning' : 'text-foreground'"
                >{{ entry.name }}</span>
                <span class="mb-1 min-w-4 flex-1 border-b border-dotted border-border-strong" aria-hidden="true" />
                <span class="flex-shrink-0 font-num tabular-nums" :class="entry.overflow ? 'text-warning' : 'text-foreground'">
                  <span class="text-[0.6875rem] font-medium text-muted-foreground">Lv</span>
                  <span class="text-lg font-semibold leading-none">{{ entry.total }}</span>
                  <span class="text-xs text-muted-foreground">/{{ entry.max }}</span>
                </span>
              </div>
              <!-- Segment bars -->
              <div class="mt-1.5 flex gap-[3px]" aria-hidden="true">
                <span
                  v-for="i in entry.max"
                  :key="i"
                  class="h-1.5 max-w-7 flex-1 -skew-x-[18deg]"
                  :class="i <= Math.min(entry.total, entry.max)
                    ? (entry.overflow ? 'bg-warning' : 'bg-primary')
                    : 'bg-border'"
                />
              </div>
            </div>
          </li>
        </ul>

        <!-- Share button -->
        <button
          type="button"
          class="cut-corner-sm mt-4 flex h-12 w-full items-center justify-center gap-2 text-sm font-bold transition-[filter]"
          :class="buildStore.isEmpty
            ? 'cursor-not-allowed bg-secondary text-muted-foreground'
            : 'cursor-pointer bg-primary text-primary-foreground hover:brightness-110'"
          :disabled="buildStore.isEmpty"
          @click="shareBuild"
        >
          <Share2 class="size-4" aria-hidden="true" />
          複製分享連結
        </button>
      </aside>
    </div>

    <!-- Equipment selector modal -->
    <EquipmentSelector
      v-model:open="selectorOpen"
      :slot-type="activeSlot"
      @select="onSelect"
    />

    <!-- Driftstone skill picker modal -->
    <DriftstoneSkillPicker
      v-model:open="driftstonePickerOpen"
      :current="activeDriftstoneSkill"
      @select="onDriftstoneSkillSelect"
    />

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toastVisible"
          class="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[110] mx-auto flex w-fit items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg md:bottom-8"
          role="status"
        >
          <Check class="size-4 text-primary" aria-hidden="true" />
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s var(--ease-out-quart), transform 0.25s var(--ease-out-quart);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

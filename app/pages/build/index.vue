<script setup lang="ts">
import { ChevronDown, Link2, RotateCcw, Trash2, WandSparkles } from 'lucide-vue-next'
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
const config = useRuntimeConfig()
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

// The share-link params a build can carry
const BUILD_PARAM_KEYS = ['w', 'h', 'c', 'a', 'wa', 'l', 'dh', 'dc', 'da', 'dw', 'dl']
let appliedSearch = ''
function applyShareParams() {
  const search = window.location.search
  if (!search || search === appliedSearch) return
  const params = Object.fromEntries(new URLSearchParams(search))
  if (!BUILD_PARAM_KEYS.some(k => params[k])) return
  appliedSearch = search
  buildStore.deserialize(params)
  buildStore.saveToStorage()
}

// A prerendered page is hydrated against HTML rendered with an empty build, under the
// query-less path it was rendered at. Changing the build before hydration finishes leaves
// the DOM showing the empty build, so restore it once the app is ready: this browser's
// saved build first, then a share link's params on top.
const nuxtApp = useNuxtApp()
const autoOpen = ref(autoBuildStore.targetSkills.length > 0 || autoBuildStore.hasRun)
let restored = !(import.meta.client && nuxtApp.isHydrating)
if (restored) {
  await buildStore.hydrate(queryParams.value)
  autoBuildStore.restoreSettings()
} else {
  onNuxtReady(async () => {
    await buildStore.hydrate({})
    restored = true
    applyShareParams()
    autoBuildStore.restoreSettings()
    if (autoBuildStore.targetSkills.length) autoOpen.value = true
  })
}
watch(() => route.fullPath, () => { if (import.meta.client && restored) applyShareParams() })

const SLOTS: BuildSlot[] = ['weapon', 'head', 'chest', 'arms', 'waist', 'legs']
const ARMOR_SLOTS: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']

// ── Equipment selector ────────────────────────────────────────────────
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

// ── Driftstone picker ─────────────────────────────────────────────────
const driftstonePickerOpen = ref(false)
const activeDriftstoneTarget = ref<{ armorSlot: ArmorSlot; slotIndex: number } | null>(null)

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

const activeDriftstoneSkillId = computed(() => {
  const t = activeDriftstoneTarget.value
  return t ? buildStore.driftstoneSkills[t.armorSlot]?.[t.slotIndex] ?? null : null
})

const activeDriftstoneLabel = computed(() => {
  const t = activeDriftstoneTarget.value
  return t ? `${getPartName(t.armorSlot)}第 ${t.slotIndex + 1} 槽` : ''
})

function socketsFor(slot: BuildSlot): (string | null)[] {
  if (slot === 'weapon') return []
  const piece = buildStore[slot]
  if (!piece || piece.driftstoneSlots <= 0) return []
  return Array.from({ length: piece.driftstoneSlots }, (_, i) => {
    const id = buildStore.driftstoneSkills[slot]?.[i]
    return id ? (skillStore.getById(id)?.name ?? id) : null
  })
}

// ── Status line ───────────────────────────────────────────────────────
const equippedCount = computed(() => SLOTS.filter(s => buildStore[s]).length)
const skillCount = computed(() => buildStore.skillSummary.length)
const maxedCount = computed(() => buildStore.skillSummary.filter(e => e.total >= e.max).length)
const socketCount = computed(() =>
  ARMOR_SLOTS.reduce((n, s) => n + (buildStore[s]?.driftstoneSlots ?? 0), 0)
)
const filledSocketCount = computed(() =>
  ARMOR_SLOTS.reduce(
    (n, s) => n + buildStore.driftstoneSkills[s].slice(0, buildStore[s]?.driftstoneSlots ?? 0).filter(Boolean).length,
    0
  )
)


function onAutoBuildSearchComplete() {
  nextTick(() => {
    document.getElementById('gear-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// ── Toast ─────────────────────────────────────────────────────────────
const toast = ref<{ message: string; undo?: () => void } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, undo?: () => void) {
  toast.value = { message, undo }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, undo ? 5000 : 2400)
}

async function shareBuild() {
  if (typeof window === 'undefined') return
  const base = config.app.baseURL.replace(/\/$/, '')
  const url = buildStore.toShareUrl(window.location.origin, `${base}/build`)
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
    showToast('已複製分享連結')
  } catch {
    showToast('無法複製，請直接複製網址列')
  }
}

function resetBuild() {
  const snapshot = buildStore.serialize()
  buildStore.clearAll()
  showToast('已清除配裝', () => {
    buildStore.deserialize(snapshot)
    toast.value = null
  })
}
</script>

<template>
  <div class="max-w-6xl mx-auto md:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-8 lg:items-start">
    <!-- Gear column -->
    <div>
      <header class="flex items-center justify-between gap-3 px-4 md:px-0 pt-3 pb-3">
        <div class="min-w-0 flex items-baseline gap-3">
          <h1 class="text-[20px] leading-none font-black tracking-[0.04em] flex-shrink-0">配裝</h1>
          <p class="text-[13px] text-ink-2 truncate">
            <span class="stamp text-[15px] font-bold text-ink">{{ equippedCount }}/6</span> 件
            <span class="mx-1 text-rule-strong" aria-hidden="true">|</span>
            技能 <span class="stamp text-[15px] font-bold text-ink">{{ skillCount }}</span>
            <template v-if="skillCount">
              <span class="mx-1 text-rule-strong" aria-hidden="true">|</span>
              滿級 <span class="stamp text-[15px] font-bold text-ink">{{ maxedCount }}</span>
            </template>
          </p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            v-if="!buildStore.isEmpty"
            type="button"
            class="flex items-center gap-1.5 h-11 px-3 -mr-1 rounded-sm text-[14px] font-medium text-ink-2 hover:text-danger hover:bg-inset transition-colors duration-200"
            @click="resetBuild"
          >
            <Trash2 :size="15" :stroke-width="2" aria-hidden="true" />
            清除
          </button>
          <button
            type="button"
            class="hidden lg:flex items-center gap-2 h-11 px-4 rounded-sm bg-forge text-forge-ink text-[14px] font-bold hover:bg-forge-hover transition-colors duration-200 disabled:opacity-45"
            :disabled="buildStore.isEmpty"
            @click="shareBuild"
          >
            <Link2 :size="16" :stroke-width="2.25" aria-hidden="true" />
            複製分享連結
          </button>
        </div>
      </header>

      <!-- Auto-build -->
      <section aria-labelledby="auto-h" class="px-4 md:px-0 mb-3">
        <h2 id="auto-h">
          <button
            type="button"
            class="w-full flex items-center gap-3 h-12 px-3 rounded-md border transition-colors duration-200"
            :class="autoOpen ? 'border-shell bg-shell text-shell-ink rounded-b-none' : 'border-rule-strong bg-panel hover:border-ink-2'"
            :aria-expanded="autoOpen"
            aria-controls="auto-panel"
            @click="autoOpen = !autoOpen"
          >
            <WandSparkles :size="18" :stroke-width="2" aria-hidden="true" />
            <span class="text-[15px] font-bold">自動配裝</span>
            <span class="text-[13px] font-normal truncate" :class="autoOpen ? 'text-shell-ink-2' : 'text-ink-2'">
              <template v-if="autoBuildStore.targetSkills.length">已設 {{ autoBuildStore.targetSkills.length }} 項目標技能</template>
              <template v-else>選技能，自動找出武器與防具組合</template>
            </span>
            <ChevronDown
              :size="18"
              :stroke-width="2"
              class="ml-auto flex-shrink-0 transition-transform duration-200"
              :class="autoOpen ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </button>
        </h2>
        <div v-show="autoOpen" id="auto-panel" class="[&>div:first-child]:rounded-t-none [&>div:first-child]:border-t-0">
          <AutoBuildPanel @search-complete="onAutoBuildSearchComplete" />
        </div>
      </section>

      <!-- Gear -->
      <section aria-labelledby="gear-h" class="md:mb-8">
        <div class="flex items-baseline justify-between px-4 md:px-0 pb-2">
          <h2 id="gear-h" class="text-[15px] font-bold">裝備</h2>
          <p v-if="socketCount" class="text-[13px] text-ink-2">
            漂流石槽 <span class="stamp text-[15px] font-bold text-ink">{{ filledSocketCount }}/{{ socketCount }}</span>
          </p>
        </div>
        <ol
          id="gear-list"
          class="bg-panel border-y md:border md:rounded-md border-rule divide-y divide-rule scroll-mt-20"
        >
          <BuildSlot
            v-for="s in SLOTS"
            :key="s"
            :slot-type="s"
            :item="buildStore[s]"
            :locked="autoBuildStore.isLocked(s)"
            :sockets="socketsFor(s)"
            @open="openSelector(s)"
            @toggle-lock="autoBuildStore.toggleLock(s)"
            @open-socket="(i) => openDriftstoneSkill(s as ArmorSlot, i)"
          />
        </ol>
      </section>
    </div>

    <!-- Ledger column -->
    <section aria-labelledby="ledger-h" class="px-4 md:px-0 pt-6 lg:pt-3 lg:sticky lg:top-[72px] pb-6">
      <div class="flex items-baseline justify-between pb-2">
        <h2 id="ledger-h" class="text-[15px] font-bold">技能</h2>
        <p class="flex items-center gap-2 text-[12px] text-ink-2" aria-hidden="true">
          <span>起步</span>
          <span class="grid grid-cols-5 gap-[2px] w-14 h-2">
            <span class="bg-t1" /><span class="bg-t2" /><span class="bg-t3" /><span class="bg-t4" /><span class="bg-t5" />
          </span>
          <span>滿級</span>
        </p>
      </div>
      <SkillLedger />
    </section>

    <!-- Share dock (phones and tablets) -->
    <div
      class="lg:hidden sticky z-30 px-4 md:px-0 py-3 bg-ground/95 backdrop-blur-[2px] border-t border-rule"
      style="bottom: calc(60px + env(safe-area-inset-bottom, 0px))"
    >
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 h-12 rounded-sm bg-forge text-forge-ink text-[16px] font-bold hover:bg-forge-hover transition-colors duration-200 disabled:opacity-45"
        :disabled="buildStore.isEmpty"
        @click="shareBuild"
      >
        <Link2 :size="18" :stroke-width="2.25" aria-hidden="true" />
        複製分享連結
      </button>
    </div>

    <EquipmentSelector
      v-model:open="selectorOpen"
      :slot-type="activeSlot"
      @select="onSelect"
    />

    <DriftstoneSkillPicker
      v-model:open="driftstonePickerOpen"
      :current-skill-id="activeDriftstoneSkillId"
      :slot-label="activeDriftstoneLabel"
      @select="onDriftstoneSkillSelect"
    />

    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          class="fixed z-[110] left-1/2 -translate-x-1/2 bottom-[calc(140px+env(safe-area-inset-bottom,0px))] lg:bottom-8 flex items-center gap-1 pl-4 pr-0.5 h-12 rounded-sm bg-shell text-shell-ink text-[14px] font-medium"
          style="box-shadow: var(--pop-shadow)"
          role="status"
        >
          <span class="pr-2">{{ toast.message }}</span>
          <button
            v-if="toast.undo"
            type="button"
            class="flex items-center gap-1.5 h-11 px-3 rounded-sm text-shell-ink font-bold hover:bg-shell-raised"
            @click="toast.undo()"
          >
            <RotateCcw :size="15" :stroke-width="2.25" aria-hidden="true" />復原
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 240ms var(--ease-out-quint), transform 240ms var(--ease-out-quint);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>

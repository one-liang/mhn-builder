<script setup lang="ts">
import { BookmarkPlus, Camera, ChevronDown, Link2, Trash2, WandSparkles } from 'lucide-vue-next'
import { AnimatePresence, motion } from 'motion-v'
import { skillColor } from '~/lib/skillColors'
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
// Until the saved build is restored the page shows skeletons, not a misleading empty build
// (the prerendered HTML included: the server never knows this browser's build)
const ready = ref(import.meta.client && restored)
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
    ready.value = true
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
const { show: showToast } = useToast()

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

const saveOpen = ref(false)
const { busy: shotBusy, shootCurrent } = useBuildShot()

function startAutoBuild() {
  autoOpen.value = true
  nextTick(() => document.getElementById('auto-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// Legend for the pip colours: the five official skill categories
const CATEGORY_LEGEND = ([['攻擊', 'attack'], ['屬性', 'element'], ['動作', 'utility'], ['防禦', 'defense'], ['耐性', 'resistance']] as const)
  .map(([name, category]) => ({ name, color: skillColor({ id: '', category }) }))

function resetBuild() {
  const snapshot = buildStore.serialize()
  buildStore.clearAll()
  showToast('已清除配裝', () => buildStore.deserialize(snapshot))
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 md:px-6 pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-10 lg:items-start">
    <!-- Gear column -->
    <div>
      <header class="pt-5 md:pt-8 pb-5 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-[34px] md:text-[44px] leading-[1.1] font-black">配裝</h1>
          <p v-if="ready" class="mt-2 text-[14px] text-ink-2">
            <span class="stamp font-bold text-ink">{{ equippedCount }}/6</span> 件
            <span class="mx-1.5" aria-hidden="true">·</span>
            技能 <span class="stamp font-bold text-ink">{{ skillCount }}</span>
            <template v-if="skillCount">
              <span class="mx-1.5" aria-hidden="true">·</span>
              滿級 <span class="stamp font-bold text-ink">{{ maxedCount }}</span>
            </template>
          </p>
          <p v-else class="mt-2 h-[22px] w-40 skeleton rounded-full" aria-hidden="true" />
        </div>
        <button
          v-if="ready && !buildStore.isEmpty"
          type="button"
          class="btn btn-sm px-3 -mr-3 flex-shrink-0 text-ink-2 hover:text-danger"
          @click="resetBuild"
        >
          <Trash2 :size="16" :stroke-width="2.25" aria-hidden="true" />
          清除
        </button>
      </header>

      <!-- Wide screens: the actions sit under the title instead of in a bottom dock -->
      <div v-if="ready && !buildStore.isEmpty" class="hidden lg:flex gap-2 pb-5 -mt-1">
        <button type="button" class="btn btn-primary" @click="shareBuild">
          <Link2 :size="18" :stroke-width="2.25" aria-hidden="true" />分享連結
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="shotBusy"
          title="把配裝畫成圖片並複製，可直接貼到聊天室"
          @click="shootCurrent"
        >
          <Camera :size="18" :stroke-width="2.25" aria-hidden="true" />截圖
        </button>
        <button type="button" class="btn btn-secondary" @click="saveOpen = true">
          <BookmarkPlus :size="18" :stroke-width="2.25" aria-hidden="true" />儲存
        </button>
      </div>

      <!-- First visit: what this is, and the two ways in -->
      <section v-if="ready && buildStore.isEmpty" aria-labelledby="intro-h" class="card p-6 mb-4">
        <h2 id="intro-h" class="text-[26px] leading-tight font-black">從想要的技能開始</h2>
        <p class="mt-2 text-[15px] text-ink-2 max-w-[34em]">
          魔物獵人 Now 繁體中文配裝模擬器。挑武器與五件防具、補上漂流石，技能等級即時算好；也能指定想要的技能，讓自動配裝找出武器與防具組合。
        </p>
        <div class="mt-5 flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary" @click="startAutoBuild">
            <WandSparkles :size="18" :stroke-width="2.25" aria-hidden="true" />自動配裝
          </button>
          <button type="button" class="btn btn-secondary" @click="openSelector('weapon')">自己挑裝備</button>
        </div>
      </section>

      <!-- Auto-build -->
      <section aria-labelledby="auto-h" class="card mb-4 scroll-mt-20 overflow-hidden">
        <h2 id="auto-h">
          <button
            type="button"
            class="w-full flex items-center gap-3 min-h-[72px] px-4 text-left hover:bg-inset"
            :aria-expanded="autoOpen"
            aria-controls="auto-panel"
            @click="autoOpen = !autoOpen"
          >
            <span class="flex items-center justify-center size-10 rounded-full bg-shell text-shell-ink flex-shrink-0">
              <WandSparkles :size="18" :stroke-width="2.25" aria-hidden="true" />
            </span>
            <span class="flex-1 min-w-0">
              <span class="block text-[17px] font-bold leading-snug">自動配裝</span>
              <span class="block text-[13px] text-ink-2 truncate">
                <template v-if="autoBuildStore.targetSkills.length">已設 {{ autoBuildStore.targetSkills.length }} 項目標技能</template>
                <template v-else>選技能，自動找出武器與防具組合</template>
              </span>
            </span>
            <ChevronDown
              :size="20"
              :stroke-width="2.25"
              class="flex-shrink-0 chevron"
              :class="autoOpen ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </button>
        </h2>
        <AnimatePresence :initial="false">
          <motion.div
            v-if="autoOpen"
            id="auto-panel"
            :initial="{ opacity: 0, y: -8 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -8, transition: { duration: 0.12 } }"
            :transition="{ type: 'spring', stiffness: 500, damping: 40 }"
          >
            <AutoBuildPanel @search-complete="onAutoBuildSearchComplete" />
          </motion.div>
        </AnimatePresence>
      </section>

      <!-- Gear -->
      <section aria-labelledby="gear-h" class="mb-6">
        <div class="flex items-baseline justify-between pb-3 pt-2">
          <h2 id="gear-h" class="text-[22px] font-black">裝備</h2>
          <p v-if="ready && socketCount" class="text-[13px] text-ink-2">
            漂流石槽 <span class="stamp text-[15px] font-bold text-ink">{{ filledSocketCount }}/{{ socketCount }}</span>
          </p>
        </div>
        <ol
          v-if="ready"
          id="gear-list"
          class="card overflow-hidden divide-y divide-rule scroll-mt-20"
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
        <ol v-else class="card divide-y divide-rule" aria-hidden="true">
          <li v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 h-[84px]">
            <span class="skeleton size-14 rounded-[14px]" />
            <span class="flex-1 grid gap-2">
              <span class="skeleton h-3 w-12 rounded-full" />
              <span class="skeleton h-4 w-40 rounded-full" />
            </span>
          </li>
        </ol>
      </section>
    </div>

    <!-- Skill board -->
    <section aria-labelledby="ledger-h" class="pb-6 lg:pt-8 lg:sticky lg:top-16">
      <div class="flex items-baseline justify-between gap-3 pb-3 pt-2">
        <h2 id="ledger-h" class="text-[22px] font-black">技能</h2>
        <p class="flex flex-wrap justify-end items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-2" aria-hidden="true">
          <span v-for="c in CATEGORY_LEGEND" :key="c.name" class="inline-flex items-center gap-1">
            <span class="size-2 rounded-full" :style="{ backgroundColor: c.color }" />{{ c.name }}
          </span>
        </p>
      </div>
      <SkillLedger v-if="ready" />
      <div v-else class="card divide-y divide-rule" aria-hidden="true">
        <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 h-[60px]">
          <span class="skeleton h-4 w-24 rounded-full" />
          <span class="ml-auto skeleton h-2 w-28 rounded-full" />
        </div>
      </div>
    </section>

    <!-- Action dock (phones and tablets): the one primary action is the share link -->
    <div
      v-if="ready && !buildStore.isEmpty"
      class="lg:hidden sticky z-30 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 pb-3 bg-ground border-t border-rule"
      style="bottom: calc(64px + env(safe-area-inset-bottom, 0px))"
    >
      <div class="flex gap-2">
        <button type="button" class="btn btn-secondary px-4" aria-label="儲存到我的配裝" @click="saveOpen = true">
          <BookmarkPlus :size="18" :stroke-width="2.25" aria-hidden="true" />
          <span class="max-[380px]:sr-only" aria-hidden="true">儲存</span>
        </button>
        <button type="button" class="btn btn-secondary px-4" aria-label="截圖並複製" :disabled="shotBusy" @click="shootCurrent">
          <Camera :size="18" :stroke-width="2.25" aria-hidden="true" />
          <span class="max-[380px]:sr-only" aria-hidden="true">截圖</span>
        </button>
        <button type="button" class="btn btn-primary flex-1" @click="shareBuild">
          <Link2 :size="18" :stroke-width="2.25" aria-hidden="true" />
          分享連結
        </button>
      </div>
    </div>

    <SaveBuildDialog v-model:open="saveOpen" />

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
  </div>
</template>

<style scoped>
.chevron {
  transition: transform 260ms var(--ease-spring);
}
</style>

<script setup lang="ts">
import type { Armor, Weapon } from '~/stores/equipment'
import { useBuildStore, type BuildSlot, type ArmorSlot } from '~/stores/build'
import { useSkillStore } from '~/stores/skill'

useSeoMeta({
  title: '配裝模擬器 | 最強獵人 - MHN 配裝模擬器',
  description: '自由搭配 MHN 武器、防具與漂流石，即時計算技能等級總量，儲存與分享你的最強配裝。',
  ogTitle: '配裝模擬器 | 最強獵人 - MHN 配裝模擬器',
  ogDescription: '自由搭配裝備，即時技能計算，一鍵分享你的最強獵人配裝。',
})

const route = useRoute()
const buildStore = useBuildStore()
const skillStore = useSkillStore()

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

function onSelect(item: Weapon | Armor | null) {
  if (!activeSlot.value) return
  buildStore.setSlot(activeSlot.value, item)
}

// Driftstone skill picker
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

const armorSlots: ArmorSlot[] = ['head', 'chest', 'arms', 'waist', 'legs']
const skillEntries = computed(() => buildStore.skillSummary)
</script>

<template>
  <div class="max-w-lg mx-auto">
    <!-- Header -->
    <div class="sticky top-12 z-10 flex items-center justify-between px-4 py-3 bg-background border-b border-border/40">
      <div>
        <h1 class="text-xl font-bold text-foreground">配裝模擬器</h1>
        <p class="text-xs text-muted-foreground mt-0.5">組合裝備，即時技能計算</p>
      </div>
      <button
        v-if="!buildStore.isEmpty"
        class="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-destructive/50 text-destructive hover:bg-destructive/15 transition-all cursor-pointer min-h-[32px]"
        @click="resetBuild"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        清除配裝
      </button>
    </div>

    <!-- Content area (uses layout's outer scroll) -->
    <div class="px-4">
      <!-- Equipment section -->
      <div class="py-2 flex flex-col gap-2">
        <!-- Weapon slot (no driftstone) -->
        <BuildSlot
          slot-type="weapon"
          :item="buildStore.weapon"
          @open="openSelector('weapon')"
        />

        <!-- Armor slots with inline driftstone circles -->
        <div
          v-for="s in armorSlots"
          :key="s"
          class="flex items-stretch gap-2"
        >
          <!-- Armor slot (flex-1) -->
          <BuildSlot
            class="flex-1 min-w-0"
            :slot-type="s"
            :item="buildStore[s]"
            @open="openSelector(s)"
          />

          <!-- Driftstone slot circles (only when armor equipped AND has slots) -->
          <template v-if="buildStore[s] && buildStore[s]!.driftstoneSlots > 0">
            <button
              v-for="i in buildStore[s]!.driftstoneSlots"
              :key="i"
              class="flex-shrink-0 w-11 flex flex-col items-center justify-center gap-1 rounded-lg border transition-all cursor-pointer"
              :class="getDriftstoneSkillName(s, i - 1)
                ? 'bg-primary/15 border-primary/50 hover:bg-primary/25'
                : 'bg-card/40 border-dashed border-border/60 hover:border-primary/50'"
              :aria-label="`漂移槽 ${i}：${getDriftstoneSkillName(s, i - 1) ?? '空'}`"
              @click="openDriftstoneSkill(s, i - 1)"
            >
              <!-- Gem icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :class="getDriftstoneSkillName(s, i - 1) ? 'text-primary' : 'text-muted-foreground/40'"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
              <!-- Filled / empty dot -->
              <span
                class="w-3 h-3 rounded-full border-2 flex-shrink-0"
                :class="getDriftstoneSkillName(s, i - 1)
                  ? 'bg-primary border-primary shadow-[0_0_6px_var(--color-primary)]'
                  : 'bg-transparent border-border/60'"
              />
              <!-- Skill name abbreviation (first 2 chars) -->
              <span
                v-if="getDriftstoneSkillName(s, i - 1)"
                class="text-[9px] font-medium text-primary leading-tight text-center w-full px-0.5 truncate"
              >
                {{ getDriftstoneSkillName(s, i - 1)!.slice(0, 2) }}
              </span>
              <span
                v-else
                class="text-[9px] text-muted-foreground/40 leading-tight"
              >+</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Divider between equipment and skill summary -->
      <div class="border-t border-border/40" />

      <!-- Skill section -->
      <div class="py-2 flex flex-col gap-1.5">
        <div
          v-if="!skillEntries.length"
          class="py-4 text-center"
        >
          <p class="text-sm text-muted-foreground">尚未選擇裝備，開始組合你的配裝吧！</p>
        </div>

        <div
          v-for="entry in skillEntries"
          :key="entry.id"
          class="flex items-center gap-3 px-2.5 py-2 rounded-lg border transition-colors"
          :class="entry.overflow
            ? 'bg-destructive/8 border-destructive/40'
            : 'bg-card/60 border-border'"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <!-- Overflow warning icon -->
                <svg
                  v-if="entry.overflow"
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="flex-shrink-0 text-destructive"
                  aria-label="技能超過最高等級"
                ><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                <!-- Gem icon for driftstone-attributed skills (only when not overflow) -->
                <svg
                  v-else-if="driftstoneSkillIds.has(entry.id)"
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="flex-shrink-0 text-primary/60"
                ><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
                <span
                  class="text-sm font-medium truncate"
                  :class="entry.overflow ? 'text-destructive' : 'text-foreground'"
                >{{ entry.name }}</span>
              </div>
              <span
                class="text-xs font-semibold flex-shrink-0"
                :class="entry.overflow ? 'text-destructive' : 'text-primary'"
              >Lv{{ entry.total }}</span>
            </div>
            <div class="flex gap-1 mt-1" aria-hidden="true">
              <span
                v-for="i in entry.max"
                :key="i"
                class="inline-block w-2 h-2 rounded-full border"
                :class="i <= Math.min(entry.total, entry.max)
                  ? (entry.overflow
                      ? 'bg-destructive border-destructive shadow-[0_0_4px_var(--color-destructive)]'
                      : 'bg-primary border-primary shadow-[0_0_4px_var(--color-primary)]')
                  : 'bg-transparent border-border'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Share button -->
    <div class="px-4 py-3 border-t border-border/40">
      <button
        class="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="buildStore.isEmpty"
        @click="shareBuild"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
        分享配裝
      </button>
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
      @select="onDriftstoneSkillSelect"
    />

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toastVisible"
          class="fixed z-[110] left-1/2 bottom-20 -translate-x-1/2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg"
          role="status"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>

<script setup lang="ts">
import { AlertTriangle, Download, Pencil, Trash2, Upload } from 'lucide-vue-next'
import { useEquipmentStore, type Armor, type Weapon } from '~/stores/equipment'
import { useSavedBuildsStore, type SavedBuild } from '~/stores/savedBuilds'
import { SAVED_BUILDS_LIMIT } from '~/lib/savedBuilds'
import { gearBadge } from '~/lib/monsters'

useSeoMeta({
  title: '我的配裝 | 最強獵人 - MHN 配裝模擬器',
  description: '存在這台裝置上的 MHN 配裝，可載入、改名、刪除，並匯出備份到其他裝置。',
  robots: 'noindex',
})

const equipmentStore = useEquipmentStore()
const savedStore = useSavedBuildsStore()
const { show: showToast } = useToast()
const { imageUrl } = useImageUrl()

await equipmentStore.load()

// Saved builds live in localStorage, so the list only exists once mounted
const ready = ref(false)
onMounted(() => {
  savedStore.load()
  ready.value = true
})

const SLOTS = [['w', 'weapon'], ['h', 'head'], ['c', 'chest'], ['a', 'arms'], ['wa', 'waist'], ['l', 'legs']] as const

function piecesOf(build: SavedBuild) {
  return SLOTS.map(([key, slot]) => {
    const id = build.params[key]
    let item: Weapon | Armor | undefined
    if (id && slot === 'weapon') item = Object.values(equipmentStore.weapons).flat().find(w => w.id === id)
    else if (id && slot !== 'weapon') item = equipmentStore.getArmorByPart(slot).find(a => a.id === id)
    return { slot, item, badge: item ? gearBadge(item, slot === 'weapon' ? 'weapon' : 'armor') : null }
  })
}

const dateFormat = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })

function openBuild(build: SavedBuild) {
  navigateTo({ path: '/build', query: build.params })
}

// ── Rename ──────────────────────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editName = ref('')

function startRename(build: SavedBuild) {
  editingId.value = build.id
  editName.value = build.name
  nextTick(() => document.getElementById(`rename-${build.id}`)?.focus())
}

function commitRename() {
  if (editingId.value) savedStore.rename(editingId.value, editName.value)
  editingId.value = null
}

// ── Delete (instant, with undo) ─────────────────────────────────────────
function removeBuild(build: SavedBuild) {
  const undo = savedStore.remove(build.id)
  if (undo) showToast(`已刪除「${build.name}」`, undo)
}

// ── Backup ──────────────────────────────────────────────────────────────
function exportBuilds() {
  const blob = new Blob([savedStore.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mhn-builds-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)

async function importBuilds(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const { added, updated, skipped } = await file.text().then(t => savedStore.importJson(t))
    const parts = [`新增 ${added} 組`]
    if (updated) parts.push(`更新 ${updated} 組`)
    if (skipped) parts.push(`略過 ${skipped} 組`)
    showToast(`已匯入：${parts.join('、')}`)
  } catch (err) {
    showToast(err instanceof Error ? err.message : '匯入失敗')
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-10">
    <PageHead title="我的配裝">
      存在這台裝置，最多 {{ SAVED_BUILDS_LIMIT }} 組
      <template v-if="ready">・目前 <span class="stamp font-bold text-ink">{{ savedStore.builds.length }}</span> 組</template>
    </PageHead>

    <div class="flex gap-2 px-4 md:px-0 pb-4">
      <button
        type="button"
        class="btn btn-secondary btn-sm flex-1"
        :disabled="!ready || !savedStore.builds.length"
        @click="exportBuilds"
      >
        <Download :size="16" :stroke-width="2.25" aria-hidden="true" />匯出備份
      </button>
      <button
        type="button"
        class="btn btn-secondary btn-sm flex-1"
        @click="fileInput?.click()"
      >
        <Upload :size="16" :stroke-width="2.25" aria-hidden="true" />匯入備份
      </button>
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="importBuilds" />
    </div>

    <p v-if="savedStore.storageError" class="mx-4 md:mx-0 mb-3 text-[14px] text-danger" role="alert">{{ savedStore.storageError }}</p>

    <!-- Loading placeholder until storage is read -->
    <ul v-if="!ready" class="grid gap-3 px-4 md:px-0" aria-hidden="true">
      <li v-for="i in 3" :key="i" class="skeleton h-[172px] rounded-[20px]" />
    </ul>

    <div v-else-if="!savedStore.builds.length" class="card mx-4 md:mx-0 px-6 py-12 text-center">
      <p class="text-[20px] font-black">還沒有存下的配裝</p>
      <p class="mt-1 text-[14px] text-ink-2">在配裝頁按「儲存」，配裝就會出現在這裡。</p>
      <NuxtLink to="/build" class="btn btn-primary mt-5">去配裝</NuxtLink>
    </div>

    <TransitionGroup v-else tag="ul" name="list" class="relative grid gap-3 px-4 md:px-0">
      <li v-for="build in savedStore.builds" :key="build.id" class="card">
        <div class="flex items-start gap-1 pl-5 pr-2 pt-4">
          <div class="flex-1 min-w-0">
            <form v-if="editingId === build.id" @submit.prevent="commitRename">
              <label :for="`rename-${build.id}`" class="sr-only">配裝名稱</label>
              <input
                :id="`rename-${build.id}`"
                v-model="editName"
                type="text"
                maxlength="40"
                class="w-full h-11 px-3 -ml-3 rounded-[12px] bg-ground ring-2 ring-ink text-[17px] font-bold outline-none"
                @blur="commitRename"
                @keydown.esc="editingId = null"
              />
            </form>
            <h2 v-else class="text-[19px] font-black leading-snug break-all">{{ build.name }}</h2>
            <p class="mt-0.5 text-[13px] text-ink-2">{{ dateFormat.format(build.updatedAt) }}</p>
          </div>
          <button
            type="button"
            class="flex items-center justify-center size-11 rounded-full text-ink-2 hover:text-ink hover:bg-inset"
            :aria-label="`重新命名「${build.name}」`"
            @click="startRename(build)"
          >
            <Pencil :size="16" :stroke-width="2" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex items-center justify-center size-11 rounded-full text-ink-2 hover:text-danger hover:bg-inset"
            :aria-label="`刪除「${build.name}」`"
            @click="removeBuild(build)"
          >
            <Trash2 :size="16" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>

        <ul class="grid grid-cols-6 gap-2 px-5 pt-3 max-w-[420px]">
          <li
            v-for="p in piecesOf(build)"
            :key="p.slot"
            class="relative aspect-square rounded-[12px] flex items-center justify-center"
            :class="p.item ? 'bg-ground' : 'border-2 border-dashed border-rule-strong text-ink-3'"
            :title="p.item?.name"
          >
            <img v-if="p.item" :src="imageUrl(p.item.image)" :alt="p.item.name" class="size-full object-contain" loading="lazy" />
            <img
              v-if="p.badge"
              :src="imageUrl(p.badge.icon)"
              :alt="p.badge.name ?? ''"
              :title="p.badge.name"
              width="20"
              height="20"
              class="absolute -right-1 -bottom-1 size-5 rounded-full bg-ground ring-2 ring-panel object-contain p-px"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <template v-else-if="!p.item">
              <ArmorPartIcon v-if="p.slot !== 'weapon'" :part="p.slot" class="size-4" aria-hidden="true" />
              <WeaponTypeIcon v-else type="sword-and-shield" class="size-4" aria-hidden="true" />
            </template>
          </li>
        </ul>

        <p v-if="savedStore.stalePartsOf(build).length" class="flex items-start gap-1.5 px-5 pt-3 text-[13px] text-danger">
          <AlertTriangle :size="15" :stroke-width="2" class="mt-0.5 flex-shrink-0" aria-hidden="true" />
          部分裝備已失效（{{ savedStore.stalePartsOf(build).join('、') }}），載入時會略過
        </p>

        <div class="p-4">
          <button
            type="button"
            class="btn btn-primary w-full"
            @click="openBuild(build)"
          >載入這組配裝</button>
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: opacity 240ms var(--ease-out-quint), transform 240ms var(--ease-out-quint);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.list-leave-active {
  position: absolute;
  inset-inline: 1rem;
}
@media (min-width: 768px) {
  .list-leave-active {
    inset-inline: 0;
  }
}
</style>

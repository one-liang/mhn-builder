<script setup lang="ts">
import { useBuildStore } from '~/stores/build'
import { useSavedBuildsStore } from '~/stores/savedBuilds'
import { SAVED_BUILDS_LIMIT } from '~/lib/savedBuilds'

// Name the current build and keep it in 我的配裝 (this browser only).
const open = defineModel<boolean>('open', { required: true })

const buildStore = useBuildStore()
const savedStore = useSavedBuildsStore()
const { show: showToast } = useToast()

const name = ref('')
const inputId = useId()

function suggestedName() {
  const top = [...buildStore.skillSummary]
    .sort((a, b) => b.total / b.max - a.total / a.max || b.total - a.total)
    .slice(0, 2)
    .map(e => `${e.name}${Math.min(e.total, e.max)}`)
  return [buildStore.weapon?.name, ...top].filter(Boolean).join(' ') || `配裝 ${savedStore.builds.length + 1}`
}

watch(open, (isOpen) => {
  if (!isOpen) return
  savedStore.load()
  name.value = suggestedName()
})

function save() {
  const saved = savedStore.add(name.value, buildStore.serialize())
  if (!saved) return
  open.value = false
  showToast(`已存到我的配裝：${saved.name}`, () => savedStore.remove(saved.id))
}
</script>

<template>
  <SheetDialog v-model:open="open" title="儲存配裝" compact>
    <form class="px-4 pt-4" style="padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px))" @submit.prevent="save">
      <template v-if="savedStore.isFull">
        <p class="text-[15px] font-bold">我的配裝已滿 {{ SAVED_BUILDS_LIMIT }} 組</p>
        <p class="mt-1 text-[14px] text-ink-2">先刪除不需要的配裝，再回來儲存。</p>
        <NuxtLink
          to="/my-builds"
          class="btn btn-secondary w-full mt-4"
          @click="open = false"
        >前往我的配裝</NuxtLink>
      </template>
      <template v-else>
        <label :for="inputId" class="block text-[14px] font-bold">名稱</label>
        <input
          :id="inputId"
          v-model="name"
          type="text"
          maxlength="40"
          autocomplete="off"
          enterkeyhint="done"
          data-autofocus
          class="mt-2 w-full h-12 px-4 rounded-[14px] bg-inset text-[16px] text-ink outline-none focus:ring-2 focus:ring-ink"
        />
        <p class="mt-2 text-[13px] text-ink-2">存在這台裝置的瀏覽器裡，換裝置可以在我的配裝匯出、匯入。</p>
        <button
          type="submit"
          class="btn btn-primary w-full mt-5"
          :disabled="!name.trim()"
        >儲存</button>
      </template>
    </form>
  </SheetDialog>
</template>

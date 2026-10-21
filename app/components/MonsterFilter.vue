<script setup lang="ts">
import { Check, PawPrint, X } from 'lucide-vue-next'
import { getMonster, type Monster } from '~/lib/monsters'
import { searchList } from '~/lib/search'

/**
 * "Filter by monster": a pill that opens a searchable sheet of crests. Selected, the
 * pill shows the monster's crest and name with a clear button. v-model is the monster id
 * ('' = no filter).
 */
const props = defineProps<{
  /** Monsters that have something on this page, in official order. */
  monsters: Monster[]
  /** Optional item count per monster id, shown under each crest (e.g. 防具 5). */
  counts?: Record<string, number>
  unit?: string
}>()

const model = defineModel<string>({ required: true })
const { imageUrl } = useImageUrl()

const open = ref(false)
const query = ref('')
const selected = computed(() => getMonster(model.value))

const shown = computed(() =>
  searchList(props.monsters, query.value, m => ({ primary: m.name, others: [m.nameEn, ...m.aliases] })),
)

function show() {
  query.value = ''
  open.value = true
}

function pick(id: string) {
  model.value = id
  open.value = false
}
</script>

<template>
  <div class="flex-shrink-0 flex items-center">
    <button
      v-if="!selected"
      type="button"
      class="chip flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-full bg-inset text-ink text-[14px] font-medium hover:bg-rule"
      @click="show"
    >
      <PawPrint :size="16" :stroke-width="2.25" aria-hidden="true" />
      依魔物篩選
    </button>
    <span v-else class="flex items-center h-10 rounded-full bg-shell text-shell-ink">
      <button
        type="button"
        class="flex items-center gap-1.5 h-10 pl-1 pr-2 rounded-full text-[14px] font-bold"
        :aria-label="`魔物：${selected.name}，點擊更換`"
        @click="show"
      >
        <img :src="imageUrl(selected.icon)" alt="" width="32" height="32" class="size-8 rounded-full bg-ground object-contain" />
        {{ selected.name }}
      </button>
      <button
        type="button"
        class="flex items-center justify-center size-10 rounded-full text-shell-ink-2 hover:text-shell-ink"
        :aria-label="`取消篩選 ${selected.name}`"
        @click="model = ''"
      >
        <X :size="16" :stroke-width="2.5" aria-hidden="true" />
      </button>
    </span>

    <SheetDialog v-model:open="open" title="選擇魔物">
      <template #controls>
        <div class="px-5 pb-3">
          <SearchField v-model="query" label="搜尋魔物" placeholder="搜尋魔物名稱，例如「火龍」" autofocus />
        </div>
      </template>

      <div class="px-4 pb-6">
        <button
          v-if="!query.trim()"
          type="button"
          class="tile w-full flex items-center justify-between h-12 px-4 mb-3 rounded-[16px] text-[15px] font-bold"
          :class="!model ? 'bg-shell text-shell-ink' : 'bg-panel hover:bg-inset'"
          @click="pick('')"
        >
          全部魔物
          <Check v-if="!model" :size="18" :stroke-width="2.5" aria-hidden="true" />
        </button>

        <ul class="grid grid-cols-4 sm:grid-cols-5 gap-2">
          <li v-for="m in shown" :key="m.id">
            <button
              type="button"
              class="tile w-full flex flex-col items-center gap-1 pt-2.5 pb-2 px-1 rounded-[16px]"
              :class="model === m.id ? 'bg-inset ring-2 ring-ink ring-inset' : 'bg-panel hover:bg-inset'"
              :aria-pressed="model === m.id"
              :aria-current="model === m.id ? 'true' : undefined"
              @click="pick(m.id)"
            >
              <img :src="imageUrl(m.icon)" alt="" width="48" height="48" class="size-12 object-contain" loading="lazy" />
              <span class="w-full truncate text-center text-[12px] font-bold leading-tight">{{ m.name }}</span>
              <span v-if="counts?.[m.id]" class="stamp text-[11px] text-ink-2 leading-none">{{ counts[m.id] }} {{ unit }}</span>
            </button>
          </li>
        </ul>

        <p v-if="!shown.length" class="py-12 text-center text-[14px] text-ink-2">找不到符合「{{ query.trim() }}」的魔物</p>
      </div>
    </SheetDialog>
  </div>
</template>

<style scoped>
.chip,
.tile {
  transition: transform 160ms var(--ease-out-quint);
}
.chip:active,
.tile:active {
  transform: scale(0.95);
}
</style>

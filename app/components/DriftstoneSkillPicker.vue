<script setup lang="ts">
import { useSkillStore, type Skill } from '~/stores/skill'
import { searchList } from '~/lib/search'
import { orderBySkillFamily } from '~/lib/skillFamilies'
import { groupDriftstones } from '~/lib/driftstones'
import driftstoneData from '../../data/driftstone-skills.json'

const props = defineProps<{
  open: boolean
  currentSkillId?: string | null
  slotLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select', skillId: string | null): void
}>()

const skillStore = useSkillStore()
const search = ref('')
const activeStone = ref('all')

// Same grouping as the 技能｜漂流石 browser: the shared pool, each colour's own skills, prime stones
const groups = groupDriftstones(driftstoneData.stones)
const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...groups.colour.map(c => ({ id: c.id, name: c.short })),
  { id: 'prime', name: '純石' },
]

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = ''
      activeStone.value = 'all'
    }
  }
)

const matching = computed(() =>
  new Set(searchList(skillStore.skills, search.value, s => ({ primary: s.name, others: [s.nameEn] })).map(s => s.id)),
)

function skillsOf(ids: string[]): Skill[] {
  const list = ids.map(id => skillStore.getById(id)).filter((s): s is Skill => !!s && matching.value.has(s.id))
  return orderBySkillFamily(list, skillStore.skills)
}

const sections = computed(() => {
  const stone = activeStone.value
  const out: { id: string; title: string; swatches: string[]; skills: Skill[] }[] = []
  if (stone !== 'prime') out.push({ id: 'shared', title: '共通技能', swatches: groups.colour.map(c => c.id), skills: skillsOf(groups.shared) })
  for (const c of groups.colour) {
    if (stone === 'all' || stone === c.id) out.push({ id: c.id, title: `${c.short}色專屬`, swatches: [c.id], skills: skillsOf(c.exclusive) })
  }
  if (stone === 'all' || stone === 'prime') out.push({ id: 'prime', title: '漂流純石', swatches: ['prime'], skills: skillsOf(groups.prime.map(p => p.skillId)) })
  return out.filter(sec => sec.skills.length)
})

function close() {
  emit('update:open', false)
}

function onSelect(skillId: string) {
  emit('select', skillId)
  close()
}

function onClear() {
  emit('select', null)
  close()
}
</script>

<template>
  <SheetDialog
    :open="open"
    :title="slotLabel ? `${slotLabel}・漂流石技能` : '漂流石技能'"
    @update:open="emit('update:open', $event)"
  >
    <template #controls>
      <div class="px-5 pb-2">
        <SearchField v-model="search" label="搜尋漂流石技能" placeholder="搜尋技能名稱" autofocus />
      </div>
      <FilterTabs in-sheet v-model="activeStone" :items="STONE_FILTERS" label="漂流石種類">
        <template #icon="{ item }">
          <StoneSwatch v-if="item.id !== 'all'" :stone="item.id" />
        </template>
      </FilterTabs>
    </template>

    <p class="px-5 pt-1 text-[13px] text-ink-2">每個漂流石槽固定提供 Lv1。</p>

    <section v-for="sec in sections" :key="sec.id" class="px-4 pt-4" :aria-labelledby="`dsp-${sec.id}`">
      <h3 :id="`dsp-${sec.id}`" class="flex items-center gap-2 pb-2 text-[15px] font-black">
        <span class="flex items-center gap-1" aria-hidden="true">
          <StoneSwatch v-for="sw in sec.swatches" :key="sw" :stone="sw" />
        </span>
        {{ sec.title }}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="skill in sec.skills"
          :key="skill.id"
          type="button"
          class="pick flex items-center min-h-12 px-4 py-2 rounded-[14px] text-left text-[14px] leading-snug"
          :class="currentSkillId === skill.id
            ? 'bg-shell text-shell-ink font-bold'
            : 'bg-panel hover:bg-inset'"
          :aria-pressed="currentSkillId === skill.id"
          @click="onSelect(skill.id)"
        >{{ skill.name }}</button>
      </div>
    </section>

    <p v-if="!sections.length" class="px-4 py-12 text-center text-[14px] text-ink-2">
      找不到符合的漂流石技能
    </p>
    <div class="h-4" aria-hidden="true" />

    <template v-if="currentSkillId" #footer>
      <button
        type="button"
        class="btn btn-secondary w-full"
        @click="onClear"
      >
        清空這個漂流石槽
      </button>
    </template>
  </SheetDialog>
</template>

<style scoped>
.pick {
  transition: transform 160ms var(--ease-out-quint);
}
.pick:active {
  transform: scale(0.95);
}
</style>

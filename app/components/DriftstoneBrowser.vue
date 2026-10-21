<script setup lang="ts">
import { useSkillStore, type Skill } from '~/stores/skill'
import { searchList } from '~/lib/search'
import { orderBySkillFamily } from '~/lib/skillFamilies'
import { groupDriftstones } from '~/lib/driftstones'
import driftstoneData from '../../data/driftstone-skills.json'

/**
 * What each driftstone can roll, organised the way the pools work: one shared pool
 * every colour stone has, a few skills of each colour's own, and prime stones that
 * each give a single skill. Skills appear once per group as plain pills, so the only
 * colour on screen is the stone swatch that heads each group.
 */
const skillStore = useSkillStore()
await skillStore.load()

const activeStone = ref('all')
const searchQuery = useQuerySearch()

const groups = groupDriftstones(driftstoneData.stones)
const STONE_FILTERS = [
  { id: 'all', name: '全部' },
  ...groups.colour.map(c => ({ id: c.id, name: c.short })),
  { id: 'prime', name: '純石' },
]

// Skills matching the search box (all of them when it is empty)
const matching = computed(() => {
  const list = searchList(skillStore.skills, searchQuery.value, s => ({ primary: s.name, others: [s.nameEn] }))
  return new Set(list.map(s => s.id))
})

function skillsOf(ids: string[]): Skill[] {
  const list = ids.map(id => skillStore.getById(id)).filter((s): s is Skill => !!s && matching.value.has(s.id))
  return orderBySkillFamily(list, skillStore.skills)
}

interface Section {
  id: string
  title: string
  note: string
  swatches: string[]
  skills: Skill[]
}

const sections = computed<Section[]>(() => {
  const stone = activeStone.value
  const out: Section[] = []
  if (stone !== 'prime') {
    out.push({
      id: 'shared',
      title: '共通技能',
      note: `${groups.colour.length} 種顏色的漂流石都能鍊出`,
      swatches: groups.colour.map(c => c.id),
      skills: skillsOf(groups.shared),
    })
  }
  for (const c of groups.colour) {
    if (stone !== 'all' && stone !== c.id) continue
    out.push({ id: c.id, title: c.name, note: '這個顏色專屬', swatches: [c.id], skills: skillsOf(c.exclusive) })
  }
  if (stone === 'all' || stone === 'prime') {
    out.push({
      id: 'prime',
      title: '漂流純石',
      note: '每顆固定鍊出一項技能',
      swatches: ['prime'],
      skills: skillsOf(groups.prime.map(p => p.skillId)),
    })
  }
  return out.filter(s => s.skills.length)
})
</script>

<template>
  <div>
    <p class="px-4 md:px-0 pb-4 text-[14px] text-ink-2 max-w-[38em]">
      每個漂流石槽提供 Lv1。六種顏色共用一組共通技能，各自再加上幾項專屬技能；漂流純石則固定鍊出一項。
    </p>

    <div class="sticky top-14 md:top-16 z-20 bg-ground pb-3">
      <div class="px-4 md:px-0 pb-2">
        <SearchField v-model="searchQuery" label="搜尋漂流石技能" placeholder="搜尋技能名稱" />
      </div>
      <FilterTabs v-model="activeStone" :items="STONE_FILTERS" label="漂流石種類">
        <template #icon="{ item }">
          <StoneSwatch v-if="item.id !== 'all'" :stone="item.id" />
        </template>
      </FilterTabs>
    </div>

    <div v-if="sections.length" class="grid gap-3 px-4 md:px-0">
      <section v-for="sec in sections" :key="sec.id" class="card p-4" :aria-labelledby="`ds-${sec.id}`">
        <header class="pb-3">
          <div class="flex items-center justify-between gap-3">
            <h3 :id="`ds-${sec.id}`" class="flex items-center gap-2.5 min-w-0 text-[17px] font-black leading-snug">
              <span class="flex items-center gap-1.5 flex-shrink-0" aria-hidden="true">
                <StoneSwatch v-for="sw in sec.swatches" :key="sw" :stone="sw" />
              </span>
              <span class="truncate">{{ sec.title }}</span>
            </h3>
            <span class="stamp text-[18px] font-bold flex-shrink-0">{{ sec.skills.length }}<span class="text-[13px] font-medium text-ink-2"> 項</span></span>
          </div>
          <p class="mt-0.5 text-[13px] text-ink-2">{{ sec.note }}</p>
        </header>
        <ul class="flex flex-wrap gap-2">
          <li v-for="skill in sec.skills" :key="skill.id">
            <NuxtLink
              :to="`/skills/${skill.id}`"
              class="pill inline-flex items-center h-10 px-4 rounded-full bg-ground text-[14px] font-medium hover:bg-inset"
            >{{ skill.name }}</NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <p v-else class="mx-4 md:mx-0 px-4 py-12 card text-center text-[14px] text-ink-2">找不到符合的漂流石技能</p>
  </div>
</template>

<style scoped>
.pill {
  transition: transform 160ms var(--ease-out-quint);
}
.pill:active {
  transform: scale(0.95);
}
</style>

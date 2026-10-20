<script setup lang="ts">
import { ChevronRight, Search } from 'lucide-vue-next'
import { useEquipmentStore, getPartName, getWeaponTypeName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { MONSTERS, monsterOfArmor, monsterOfWeapon, monsterTermsOf } from '~/lib/monsters'
import { searchList } from '~/lib/search'

// Site-wide search: one box that jumps to any monster's gear, weapon, armor piece or skill.
const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()
const { imageUrl } = useImageUrl()

const open = ref(false)
const query = ref('')
const LIMIT = 6

async function show() {
  query.value = ''
  open.value = true
  await Promise.all([equipmentStore.load(), skillStore.load()])
}

const q = computed(() => query.value.trim())

const monsters = computed(() =>
  q.value ? searchList(MONSTERS, q.value, m => ({ primary: m.name, others: [m.nameEn, ...m.aliases] })) : []
)

const weapons = computed(() => {
  if (!q.value) return []
  return searchList(Object.values(equipmentStore.weapons).flat(), q.value, w => ({
    primary: w.name,
    others: [w.nameEn, ...monsterTermsOf(monsterOfWeapon(w.id))],
  }))
})

const armor = computed(() => {
  if (!q.value) return []
  return searchList(equipmentStore.allArmor, q.value, a => ({
    primary: a.name,
    others: [a.nameEn, a.setName, a.setNameEn, ...monsterTermsOf(monsterOfArmor(a.id))],
  }))
})

const skills = computed(() =>
  q.value ? searchList(skillStore.skills, q.value, s => ({ primary: s.name, others: [s.nameEn] })) : []
)

const empty = computed(() => q.value && !monsters.value.length && !weapons.value.length && !armor.value.length && !skills.value.length)

function go(to: string) {
  open.value = false
  navigateTo(to)
}

// "/" opens the search from anywhere except while typing in a field
function onKeydown(e: KeyboardEvent) {
  if (e.key !== '/' || open.value || e.metaKey || e.ctrlKey || e.altKey) return
  const t = e.target as HTMLElement | null
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
  e.preventDefault()
  show()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <button
    type="button"
    class="flex items-center justify-center size-11 rounded-sm text-shell-ink-2 hover:text-shell-ink hover:bg-shell-raised transition-colors duration-200"
    aria-label="搜尋武器、防具、技能或魔物"
    title="搜尋（/）"
    @click="show"
  >
    <Search :size="20" :stroke-width="1.75" aria-hidden="true" />
  </button>

  <SheetDialog v-model:open="open" title="搜尋">
    <template #controls>
      <div class="px-4 py-3">
        <SearchField v-model="query" label="搜尋武器、防具、技能或魔物" placeholder="例如「銀火」「攻擊」「雷狼」" autofocus />
      </div>
    </template>

    <p v-if="!q" class="px-4 py-10 text-center text-[14px] text-ink-2">輸入魔物、裝備或技能名稱。只記得魔物也能找到它的武器和防具。</p>
    <p v-else-if="empty" class="px-4 py-10 text-center text-[14px] text-ink-2">找不到符合「{{ q }}」的結果</p>

    <template v-else>
      <section v-if="monsters.length" aria-labelledby="ss-monsters" class="pt-3">
        <h3 id="ss-monsters" class="px-4 pb-2 text-[13px] font-bold text-ink-2">魔物</h3>
        <ul class="strip flex gap-2 overflow-x-auto px-4 pb-1">
          <li v-for="m in monsters" :key="m.id" class="flex-shrink-0">
            <button
              type="button"
              class="flex flex-col items-center gap-1 w-[72px] py-2 rounded-sm hover:bg-inset transition-colors duration-150"
              @click="go(`/weapons?q=${encodeURIComponent(m.name)}`)"
            >
              <img :src="imageUrl(m.icon)" alt="" width="44" height="44" class="size-11 object-contain" />
              <span class="w-full truncate text-center text-[12px] font-bold">{{ m.name }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="weapons.length" aria-labelledby="ss-weapons" class="pt-3">
        <h3 id="ss-weapons" class="flex items-baseline justify-between px-4 pb-1 text-[13px] font-bold text-ink-2">
          武器
          <button v-if="weapons.length > LIMIT" type="button" class="h-9 -my-2 text-[13px] font-medium text-ink underline underline-offset-4" @click="go(`/weapons?q=${encodeURIComponent(q)}`)">全部 {{ weapons.length }} 把</button>
        </h3>
        <ul class="divide-y divide-rule">
          <li v-for="w in weapons.slice(0, LIMIT)" :key="w.id">
            <button type="button" class="w-full flex items-center gap-3 px-4 py-2 min-h-[56px] text-left hover:bg-inset transition-colors duration-150" @click="go(`/weapons/${w.type}/${w.id}`)">
              <span class="relative plate flex items-center justify-center size-10 flex-shrink-0">
                <img :src="imageUrl(w.image)" alt="" width="40" height="40" class="size-full object-contain" loading="lazy" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[15px] font-bold truncate">{{ w.name }}</span>
                <span class="block text-[12px] text-ink-2 truncate">{{ getWeaponTypeName(w.type) }}<template v-if="monsterOfWeapon(w.id)">・{{ monsterOfWeapon(w.id)!.name }}</template></span>
              </span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3 flex-shrink-0" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>

      <section v-if="armor.length" aria-labelledby="ss-armor" class="pt-3">
        <h3 id="ss-armor" class="flex items-baseline justify-between px-4 pb-1 text-[13px] font-bold text-ink-2">
          防具
          <button v-if="armor.length > LIMIT" type="button" class="h-9 -my-2 text-[13px] font-medium text-ink underline underline-offset-4" @click="go(`/armor?q=${encodeURIComponent(q)}`)">全部 {{ armor.length }} 件</button>
        </h3>
        <ul class="divide-y divide-rule">
          <li v-for="a in armor.slice(0, LIMIT)" :key="a.id">
            <button type="button" class="w-full flex items-center gap-3 px-4 py-2 min-h-[56px] text-left hover:bg-inset transition-colors duration-150" @click="go(`/armor/${a.id}`)">
              <span class="plate flex items-center justify-center size-10 flex-shrink-0">
                <img :src="imageUrl(a.image)" alt="" width="40" height="40" class="size-full object-contain" loading="lazy" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[15px] font-bold truncate">{{ a.name }}</span>
                <span class="block text-[12px] text-ink-2 truncate">{{ a.setName }}・{{ getPartName(a.part) }}</span>
              </span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3 flex-shrink-0" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>

      <section v-if="skills.length" aria-labelledby="ss-skills" class="pt-3 pb-3">
        <h3 id="ss-skills" class="flex items-baseline justify-between px-4 pb-1 text-[13px] font-bold text-ink-2">
          技能
          <button v-if="skills.length > LIMIT" type="button" class="h-9 -my-2 text-[13px] font-medium text-ink underline underline-offset-4" @click="go(`/skills?q=${encodeURIComponent(q)}`)">全部 {{ skills.length }} 項</button>
        </h3>
        <ul class="divide-y divide-rule">
          <li v-for="s in skills.slice(0, LIMIT)" :key="s.id">
            <button type="button" class="w-full flex items-center gap-3 px-4 py-2 min-h-[52px] text-left hover:bg-inset transition-colors duration-150" @click="go(`/skills/${s.id}`)">
              <span class="flex-1 min-w-0">
                <span class="block text-[15px] font-bold truncate">{{ s.name }}</span>
                <span class="block text-[12px] text-ink-2 truncate">{{ s.description }}</span>
              </span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3 flex-shrink-0" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>
    </template>
  </SheetDialog>
</template>

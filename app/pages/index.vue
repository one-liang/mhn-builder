<script setup lang="ts">
import { ArrowRight, ChevronRight, Gem, Hexagon } from 'lucide-vue-next'
import { useBuildStore, type BuildSlot } from '~/stores/build'
import { useEquipmentStore, getPartName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import driftstoneData from '../../data/driftstone-skills.json'

useSeoMeta({
  title: '最強獵人 - MHN 魔物獵人 Now 配裝模擬器 | 自動配裝・技能計算・漂流石搭配',
  description: '最強獵人是 Monster Hunter Now 最完整的繁體中文配裝模擬器，提供所有武器、防具、技能、漂流石資料查詢，支援自動配裝與技能計算。',
  ogTitle: '最強獵人 - MHN 魔物獵人 Now 配裝模擬器',
  ogDescription: '最完整的 MHN 繁體中文配裝模擬器，查詢所有裝備資料、自動配裝、技能計算。',
})

const buildStore = useBuildStore()
const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()
const { imageUrl } = useImageUrl()

await Promise.all([equipmentStore.load(), skillStore.load()])

// The saved build lives in localStorage, so it can only be read in the browser.
const ready = ref(false)
onMounted(() => {
  if (!buildStore.hydrated) buildStore.loadFromStorage()
  ready.value = true
})

const SLOTS: BuildSlot[] = ['weapon', 'head', 'chest', 'arms', 'waist', 'legs']
const hasSaved = computed(() => ready.value && !buildStore.isEmpty)
const topSkills = computed(() =>
  [...buildStore.skillSummary]
    .sort((a, b) => b.total / b.max - a.total / a.max || b.total - a.total)
    .slice(0, 4)
)

const weaponCount = computed(() => equipmentStore.weaponTypes.reduce((n, wt) => n + wt.count, 0))

const index = computed(() => [
  { to: '/weapons', name: '武器', note: `${equipmentStore.weaponTypes.length} 種武器`, count: weaponCount.value, unit: '把', icon: 'weapon' },
  { to: '/armor', name: '防具', note: '頭・胸・腕・腰・腿', count: equipmentStore.allArmor.length, unit: '件', icon: 'armor' },
  { to: '/skills', name: '技能', note: '各等級效果與出處', count: skillStore.skills.length, unit: '項', icon: 'skill' },
  { to: '/driftstones', name: '漂流石', note: '可鍊成的技能', count: driftstoneData.achievableSkillIds.length, unit: '項', icon: 'gem' },
])
</script>

<template>
  <div>
    <!-- The bench: brand, what it does, and the way in -->
    <section class="bg-shell text-shell-ink">
      <div class="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-8 md:pt-14 md:pb-14 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:gap-12 md:items-end">
        <div>
          <div class="flex items-end gap-3 md:gap-4">
            <h1 class="text-[46px] md:text-[64px] leading-none font-black tracking-[0.06em]">最強獵人</h1>
            <span
              class="stamp mb-1 flex items-center h-7 md:h-9 px-2 border-2 border-shell-ink-2 rounded-[3px] text-[16px] md:text-[20px] leading-none font-bold uppercase tracking-[0.18em] text-shell-ink-2"
              aria-hidden="true"
            >MHN</span>
          </div>
          <p class="mt-5 text-[16px] md:text-[18px] leading-relaxed text-shell-ink-2 max-w-[30em]">
            魔物獵人 Now 繁體中文配裝模擬器。挑武器與五件防具、補上漂流石，技能等級即時算好；也能指定想要的技能，讓它自動找出防具組合。
          </p>
          <NuxtLink
            to="/build"
            class="mt-6 inline-flex items-center gap-2 h-12 pl-5 pr-4 rounded-sm bg-forge text-forge-ink text-[16px] font-bold hover:bg-forge-hover transition-colors duration-200"
          >
            {{ hasSaved ? '繼續上次的配裝' : '開始配裝' }}
            <ArrowRight :size="18" :stroke-width="2.25" aria-hidden="true" />
          </NuxtLink>
        </div>

        <!-- Saved build preview, or how to read a temper bar -->
        <div class="mt-8 md:mt-0">
          <div v-if="hasSaved" class="bg-panel text-ink rounded-md overflow-hidden" style="box-shadow: var(--pop-shadow)">
            <div class="flex items-center justify-between px-4 h-11 border-b border-rule">
              <p class="text-[14px] font-bold">上次的配裝</p>
              <NuxtLink to="/build" class="flex items-center gap-0.5 h-11 -mr-2 px-2 text-[13px] text-ink-2 hover:text-ink">
                打開 <ChevronRight :size="15" :stroke-width="2" aria-hidden="true" />
              </NuxtLink>
            </div>
            <ul class="grid grid-cols-6 gap-1.5 px-4 pt-3">
              <li
                v-for="s in SLOTS"
                :key="s"
                class="aspect-square rounded-sm overflow-hidden flex items-center justify-center"
                :class="buildStore[s] ? 'plate' : 'border border-dashed border-rule-strong text-ink-3'"
                :title="buildStore[s]?.name ?? `${s === 'weapon' ? '武器' : getPartName(s)}：未裝備`"
              >
                <img v-if="buildStore[s]" :src="imageUrl(buildStore[s]!.image)" :alt="buildStore[s]!.name" class="size-full object-contain" />
                <ArmorPartIcon v-else-if="s !== 'weapon'" :part="s" class="size-4" aria-hidden="true" />
                <WeaponTypeIcon v-else type="sword-and-shield" class="size-4" aria-hidden="true" />
              </li>
            </ul>
            <ul class="px-4 py-3 grid gap-1.5">
              <li
                v-for="e in topSkills"
                :key="e.id"
                class="grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-3 text-[14px]"
              >
                <span class="truncate">{{ e.name }}</span>
                <TemperBar :total="e.total" :max="e.max" size="sm" />
                <span class="stamp text-right font-bold text-[16px]">{{ e.total }}<span class="text-ink-2 text-[13px]">/{{ e.max }}</span></span>
              </li>
            </ul>
          </div>

          <figure v-else class="border border-shell-rule rounded-md px-4 py-4">
            <figcaption class="text-[14px] font-bold">技能條怎麼看</figcaption>
            <p class="mt-1 text-[13px] text-shell-ink-2">
              每一格是一級，格數就是該技能的上限。等級越接近上限，顏色越像回火到底的鋼，從麥稈黃一路走到深藍；滿級的最後一格一定是深藍。
            </p>
            <div class="mt-3 grid grid-cols-5 gap-[3px]" aria-hidden="true">
              <span class="h-3 bg-t1" /><span class="h-3 bg-t2" /><span class="h-3 bg-t3" /><span class="h-3 bg-t4" /><span class="h-3 bg-t5" />
            </div>
            <p class="mt-1.5 flex justify-between text-[12px] text-shell-ink-2" aria-hidden="true">
              <span>剛起步</span><span>滿級</span>
            </p>
            <p class="mt-3 flex items-center gap-2 text-[13px] text-shell-ink-2">
              <span class="w-[2px] h-4 bg-shell-ink" aria-hidden="true" />
              <span class="spent-demo w-4 h-2.5" aria-hidden="true" />
              直線是上限；超過的等級會變成灰色斜紋，代表浪費了。
            </p>
          </figure>
        </div>
      </div>
    </section>

    <!-- Reference index -->
    <section aria-labelledby="ref-h" class="max-w-6xl mx-auto md:px-6 pt-7 pb-10">
      <h2 id="ref-h" class="px-4 md:px-0 pb-2 text-[15px] font-bold">資料庫</h2>
      <ul class="grid md:grid-cols-2 gap-px bg-rule border-y md:border md:rounded-md border-rule overflow-hidden">
        <li v-for="item in index" :key="item.to" class="bg-panel">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-4 pl-4 pr-3 min-h-[72px] transition-colors duration-150 hover:bg-inset"
          >
            <span class="flex items-center justify-center size-11 rounded-md bg-shell text-shell-ink flex-shrink-0">
              <WeaponTypeIcon v-if="item.icon === 'weapon'" type="long-sword" class="size-6" aria-hidden="true" />
              <ArmorPartIcon v-else-if="item.icon === 'armor'" part="chest" class="size-6" aria-hidden="true" />
              <Hexagon v-else-if="item.icon === 'skill'" :size="22" :stroke-width="1.75" aria-hidden="true" />
              <Gem v-else :size="22" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <span class="flex-1 min-w-0">
              <span class="block text-[17px] font-bold">{{ item.name }}</span>
              <span class="block text-[13px] text-ink-2">{{ item.note }}</span>
            </span>
            <span class="flex items-baseline gap-1">
              <span class="stamp text-[28px] font-extrabold leading-none">{{ item.count }}</span>
              <span class="text-[12px] text-ink-2">{{ item.unit }}</span>
            </span>
            <ChevronRight :size="18" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.spent-demo {
  background: repeating-linear-gradient(135deg, var(--spent) 0 2px, transparent 2px 4px);
  box-shadow: inset 0 0 0 1px var(--spent);
}
</style>

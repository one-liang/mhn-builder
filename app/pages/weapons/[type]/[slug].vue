<script setup lang="ts">
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'
import { useEquipmentStore, getWeaponTypeName } from '~/stores/equipment'
import { useSkillStore } from '~/stores/skill'
import { monsterOfWeapon } from '~/lib/monsters'

const route = useRoute()
const type = route.params.type as string
const slug = route.params.slug as string
const typeName = getWeaponTypeName(type)

const equipmentStore = useEquipmentStore()
const skillStore = useSkillStore()
await Promise.all([equipmentStore.load(), skillStore.load()])

const weapon = computed(() => equipmentStore.getWeaponById(type, slug))
const { imageUrl } = useImageUrl()
const colorOf = useSkillColor()
const monster = computed(() => (weapon.value ? monsterOfWeapon(weapon.value.id) : null))

useSeoMeta({
  title: () => weapon.value ? `${weapon.value.name} | 最強獵人 - MHN 配裝模擬器` : '武器詳情 | 最強獵人',
  description: () => weapon.value ? `${weapon.value.name} - ${typeName}，滿級攻擊力 ${weapon.value.attack}。` : '',
  ogTitle: () => weapon.value ? `${weapon.value.name} | 最強獵人` : '',
  ogDescription: () => weapon.value ? `${typeName}，滿級攻擊力 ${weapon.value.attack}` : '',
})

const elementNames: Record<string, string> = {
  fire: '火', water: '水', thunder: '雷', ice: '冰', dragon: '龍',
  poison: '毒', paralysis: '麻', sleep: '眠', blast: '爆',
}
</script>

<template>
  <div class="max-w-3xl mx-auto md:px-6 pb-10">
    <div class="px-4 md:px-0 pt-4 md:pt-6">
      <NuxtLink
        :to="`/weapons/${type}`"
        class="inline-flex items-center gap-1.5 h-10 -ml-3 pl-3 pr-4 rounded-full text-[14px] font-medium text-ink-2 hover:text-ink hover:bg-inset"
      >
        <ArrowLeft :size="16" :stroke-width="2.25" aria-hidden="true" />
        所有{{ typeName }}
      </NuxtLink>
    </div>

    <template v-if="weapon">
      <header class="flex items-center gap-5 px-4 md:px-0 pt-3 pb-6">
        <span class="flex items-center justify-center size-28 flex-shrink-0 rounded-[24px] bg-panel overflow-hidden">
          <img
            v-if="weapon.image"
            :src="imageUrl(weapon.image)"
            :alt="weapon.name"
            width="96"
            height="96"
            class="size-full object-contain"
            @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
          />
          <WeaponTypeIcon v-else :type="type" class="size-10 text-ink-2" />
        </span>
        <div class="min-w-0">
          <h1 class="text-[28px] md:text-[36px] leading-[1.15] font-black">{{ weapon.name }}</h1>
          <p v-if="weapon.source === 'manual'" class="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-inset text-[12px] font-medium text-ink-2">非官方資料：官方網站沒有列出，依遊戲內資訊手動輸入</p>
          <p class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[14px] text-ink-2">
            <WeaponTypeIcon :type="type" class="size-4" aria-hidden="true" />{{ typeName }}
            <template v-if="monster">
              <span class="text-rule-strong" aria-hidden="true">|</span>
              <img :src="imageUrl(monster.icon)" alt="" width="20" height="20" class="size-5 object-contain" />
              <NuxtLink
                :to="`/weapons?q=${encodeURIComponent(monster.name)}`"
                class="underline underline-offset-4 decoration-rule-strong hover:text-ink"
              >{{ monster.name }}</NuxtLink>
            </template>
          </p>
        </div>
      </header>

      <!-- Spec strip -->
      <dl class="grid grid-cols-3 gap-2.5 mx-4 md:mx-0">
        <div class="card px-4 py-4">
          <dt class="text-[12px] text-ink-2">攻擊力</dt>
          <dd class="stamp text-[32px] font-extrabold leading-none mt-2 tracking-[-0.02em]">{{ weapon.attack }}</dd>
        </div>
        <div class="card px-4 py-4">
          <dt class="text-[12px] text-ink-2">會心率</dt>
          <dd class="stamp text-[32px] font-extrabold leading-none mt-2 tracking-[-0.02em]" :class="weapon.affinity < 0 ? 'text-danger' : ''">
            {{ weapon.affinity > 0 ? '+' : '' }}{{ weapon.affinity }}<span class="text-[18px]">%</span>
          </dd>
        </div>
        <div class="card px-4 py-4">
          <dt class="text-[12px] text-ink-2">
            屬性<template v-if="weapon.element">・{{ elementNames[weapon.element.type] || weapon.element.type }}</template>
          </dt>
          <dd v-if="weapon.element" class="stamp text-[30px] font-extrabold leading-none mt-1">{{ weapon.element.value }}</dd>
          <dd v-else class="text-[15px] text-ink-2 mt-2">無</dd>
        </div>
      </dl>

      <section v-if="weapon.spSkill" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">SP 技能</h2>
        <p class="pt-3 text-[15px]">{{ weapon.spSkill.replace('【SP】', '') }}</p>
      </section>

      <section v-if="weapon.skills.length" class="mt-8">
        <h2 class="mx-4 md:mx-0 pb-3 text-[22px] font-black">裝備技能</h2>
        <ul class="card mx-4 md:mx-0 overflow-hidden divide-y divide-rule">
          <li v-for="skill in weapon.skills" :key="skill.skillId">
            <NuxtLink
              :to="`/skills/${skill.skillId}`"
              class="grid grid-cols-[minmax(0,1fr)_auto_3rem_1rem] items-center gap-3 px-4 min-h-[52px] hover:bg-inset"
            >
              <span class="text-[15px] font-bold truncate">{{ skillStore.getById(skill.skillId)?.name || skill.skillId }}</span>
              <TemperBar :total="skill.level" :max="skillStore.getById(skill.skillId)?.maxLevel ?? skill.level" :color="colorOf(skill.skillId)" />
              <span class="stamp text-[18px] font-bold text-right">Lv{{ skill.level }}</span>
              <ChevronRight :size="16" :stroke-width="2" class="text-ink-3" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section v-if="weapon.ammo?.length" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">彈藥種類</h2>
        <table class="w-full text-[14px] card overflow-hidden">
          <thead>
            <tr class="border-b border-rule text-[12px] text-ink-2">
              <th scope="col" class="text-left font-medium py-2.5 pl-4">名稱</th>
              <th scope="col" class="text-right font-medium py-2 px-2">裝填數</th>
              <th scope="col" class="text-right font-medium py-2 px-2">後座力</th>
              <th scope="col" class="text-right font-medium py-2.5 pr-4">填彈</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-rule">
            <tr v-for="ammo in weapon.ammo" :key="ammo.name">
              <th scope="row" class="text-left font-bold py-2.5 pl-4">{{ ammo.name }}</th>
              <td class="stamp text-right text-[16px] font-bold px-2">{{ ammo.capacity }}</td>
              <td class="text-right px-2">{{ ammo.recoil }}</td>
              <td class="text-right pr-4">{{ ammo.reload }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="weapon.chargingShots?.length" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">蓄力射擊</h2>
        <ol class="flex flex-wrap gap-2 pt-3">
          <li
            v-for="(shot, i) in weapon.chargingShots"
            :key="shot + i"
            class="flex items-center gap-2 h-10 pl-3 pr-4 rounded-full bg-panel text-[14px] font-medium"
          >
            <span class="stamp text-[13px] font-bold text-ink-2">{{ i + 1 }}</span>{{ shot }}
          </li>
        </ol>
      </section>

      <section v-if="weapon.bottleType && weapon.bottleType !== '無'" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">瓶類型</h2>
        <p class="pt-3 text-[15px]">{{ weapon.bottleType }}</p>
      </section>

      <section v-if="weapon.phial" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">瓶類型</h2>
        <p class="pt-3 text-[15px] font-bold">{{ weapon.phial.name }}</p>
        <p v-if="weapon.phial.description" class="mt-1 text-[14px] text-ink-2 max-w-[65ch]">{{ weapon.phial.description }}</p>
      </section>

      <section v-if="weapon.shellingType" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">砲擊類型</h2>
        <p class="pt-3 text-[15px] font-bold">{{ weapon.shellingType.name }}</p>
        <p v-if="weapon.shellingType.description" class="mt-1 text-[14px] text-ink-2 max-w-[65ch]">{{ weapon.shellingType.description }}</p>
      </section>

      <section v-if="weapon.melodies?.length" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">旋律效果</h2>
        <dl class="divide-y divide-rule">
          <div v-for="melody in weapon.melodies" :key="melody.name" class="py-3">
            <dt class="text-[15px] font-bold">{{ melody.name }}</dt>
            <dd v-if="melody.description" class="mt-0.5 text-[14px] text-ink-2 max-w-[65ch]">{{ melody.description }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="weapon.kinsect" class="mt-8 px-4 md:px-0">
        <h2 class="pb-3 text-[22px] font-black">獵蟲：{{ weapon.kinsect.name }}</h2>
        <dl class="grid grid-cols-2 gap-x-4 divide-y divide-rule [&>div:nth-child(2)]:border-t-0">
          <div class="py-3">
            <dt class="text-[12px] text-ink-2">獵蟲類型</dt>
            <dd class="text-[15px] font-medium">{{ weapon.kinsect.type }}</dd>
          </div>
          <div class="py-3">
            <dt class="text-[12px] text-ink-2">性能類型</dt>
            <dd class="text-[15px] font-medium">{{ weapon.kinsect.performanceType }}</dd>
          </div>
          <div class="py-3">
            <dt class="text-[12px] text-ink-2">攻擊系統</dt>
            <dd class="text-[15px] font-medium">{{ weapon.kinsect.attackSystem }}</dd>
          </div>
          <div class="py-3">
            <dt class="text-[12px] text-ink-2">獵蟲加成</dt>
            <dd class="text-[15px] font-medium">{{ weapon.kinsect.bonus }}</dd>
          </div>
        </dl>
      </section>
    </template>

    <div v-else class="card mx-4 md:mx-0 mt-6 px-4 py-16 text-center">
      <p class="text-[16px] font-bold">找不到這把武器</p>
      <NuxtLink :to="`/weapons/${type}`" class="btn btn-secondary btn-sm mt-4">回到{{ typeName }}列表</NuxtLink>
    </div>
  </div>
</template>

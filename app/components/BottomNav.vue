<script setup lang="ts">
import { Anvil, Bookmark, Gem, Hexagon } from 'lucide-vue-next'

// One navigation model, two placements: inline in the top band on wide screens,
// a thumb bar along the bottom edge on phones.
const props = defineProps<{
  variant: 'top' | 'bottom'
}>()

const route = useRoute()

const tabs = [
  { name: '配裝', path: '/build', icon: 'anvil' },
  { name: '武器', path: '/weapons', icon: 'weapon' },
  { name: '防具', path: '/armor', icon: 'armor' },
  { name: '技能', path: '/skills', icon: 'skill' },
  { name: '漂流石', path: '/driftstones', icon: 'gem' },
  { name: '我的配裝', path: '/my-builds', icon: 'saved' },
] as const

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    v-if="props.variant === 'bottom'"
    class="fixed inset-x-0 bottom-0 z-50 bg-shell text-shell-ink-2 border-t border-shell-rule md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    aria-label="主要導覽"
  >
    <ul class="grid grid-cols-6 h-[60px] max-w-xl mx-auto">
      <li v-for="tab in tabs" :key="tab.path" class="contents">
        <NuxtLink
          :to="tab.path"
          class="relative flex flex-col items-center justify-center gap-1 transition-colors duration-200"
          :class="isActive(tab.path) ? 'text-shell-ink bg-shell-raised' : 'hover:text-shell-ink'"
          :aria-current="isActive(tab.path) ? 'page' : undefined"
        >
          <span
            v-if="isActive(tab.path)"
            class="absolute inset-x-3 top-0 h-[3px] bg-shell-ink"
            aria-hidden="true"
          />
          <Anvil v-if="tab.icon === 'anvil'" :size="22" :stroke-width="1.75" aria-hidden="true" />
          <WeaponTypeIcon v-else-if="tab.icon === 'weapon'" type="great-sword" class="size-[22px]" aria-hidden="true" />
          <ArmorPartIcon v-else-if="tab.icon === 'armor'" part="head" class="size-[22px]" aria-hidden="true" />
          <Hexagon v-else-if="tab.icon === 'skill'" :size="22" :stroke-width="1.75" aria-hidden="true" />
          <Gem v-else-if="tab.icon === 'gem'" :size="22" :stroke-width="1.75" aria-hidden="true" />
          <Bookmark v-else :size="22" :stroke-width="1.75" aria-hidden="true" />
          <span class="text-[12px] leading-none font-medium">{{ tab.name }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>

  <nav v-else class="hidden md:block" aria-label="主要導覽">
    <ul class="flex items-stretch h-14">
      <li v-for="tab in tabs" :key="tab.path">
        <NuxtLink
          :to="tab.path"
          class="relative flex items-center gap-2 h-full px-4 text-[14px] font-medium transition-colors duration-200"
          :class="isActive(tab.path) ? 'text-shell-ink' : 'text-shell-ink-2 hover:text-shell-ink'"
          :aria-current="isActive(tab.path) ? 'page' : undefined"
        >
          <Anvil v-if="tab.icon === 'anvil'" :size="18" :stroke-width="1.75" aria-hidden="true" />
          <WeaponTypeIcon v-else-if="tab.icon === 'weapon'" type="great-sword" class="size-[18px]" aria-hidden="true" />
          <ArmorPartIcon v-else-if="tab.icon === 'armor'" part="head" class="size-[18px]" aria-hidden="true" />
          <Hexagon v-else-if="tab.icon === 'skill'" :size="18" :stroke-width="1.75" aria-hidden="true" />
          <Gem v-else-if="tab.icon === 'gem'" :size="18" :stroke-width="1.75" aria-hidden="true" />
          <Bookmark v-else :size="18" :stroke-width="1.75" aria-hidden="true" />
          {{ tab.name }}
          <span
            v-if="isActive(tab.path)"
            class="absolute inset-x-3 bottom-0 h-[3px] bg-shell-ink"
            aria-hidden="true"
          />
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

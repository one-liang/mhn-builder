<script setup lang="ts">
import { Bookmark, Hexagon, Swords } from 'lucide-vue-next'

// One navigation model, two placements: pills in the header on wide screens,
// a thumb bar along the bottom edge on phones.
const props = defineProps<{
  variant: 'top' | 'bottom'
}>()

const route = useRoute()

const tabs = [
  { name: '配裝', path: '/build', icon: 'build', match: ['/build'] },
  { name: '防具', path: '/armor', icon: 'armor', match: ['/armor'] },
  { name: '武器', path: '/weapons', icon: 'weapon', match: ['/weapons'] },
  { name: '技能', path: '/skills', icon: 'skill', match: ['/skills', '/driftstones'] },
  { name: '我的配裝', path: '/my-builds', icon: 'saved', match: ['/my-builds'] },
] as const

function isActive(match: readonly string[]) {
  return match.some(p => route.path.startsWith(p))
}
</script>

<template>
  <nav
    v-if="props.variant === 'bottom'"
    class="fixed inset-x-0 bottom-0 z-50 bg-ground border-t border-rule md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    aria-label="主要導覽"
  >
    <ul class="grid grid-cols-5 h-16 max-w-xl mx-auto">
      <li v-for="tab in tabs" :key="tab.path" class="contents">
        <NuxtLink
          :to="tab.path"
          class="tab flex flex-col items-center justify-center gap-1"
          :class="isActive(tab.match) ? 'text-ink' : 'text-ink-3'"
          :aria-current="isActive(tab.match) ? 'page' : undefined"
        >
          <span class="tab-icon flex items-center justify-center h-7 w-12 rounded-full" :class="isActive(tab.match) ? 'bg-inset' : ''">
            <Swords v-if="tab.icon === 'build'" :size="21" :stroke-width="isActive(tab.match) ? 2.25 : 1.75" aria-hidden="true" />
            <ArmorPartIcon v-else-if="tab.icon === 'armor'" part="head" class="size-[21px]" aria-hidden="true" />
            <WeaponTypeIcon v-else-if="tab.icon === 'weapon'" type="great-sword" class="size-[21px]" aria-hidden="true" />
            <Hexagon v-else-if="tab.icon === 'skill'" :size="21" :stroke-width="isActive(tab.match) ? 2.25 : 1.75" aria-hidden="true" />
            <Bookmark v-else :size="21" :stroke-width="isActive(tab.match) ? 2.25 : 1.75" aria-hidden="true" />
          </span>
          <span class="text-[11px] leading-none" :class="isActive(tab.match) ? 'font-bold' : 'font-medium'">{{ tab.name }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>

  <nav v-else class="hidden md:block" aria-label="主要導覽">
    <ul class="flex items-center gap-1">
      <li v-for="tab in tabs" :key="tab.path">
        <NuxtLink
          :to="tab.path"
          class="flex items-center h-10 px-4 rounded-full text-[15px]"
          :class="isActive(tab.match) ? 'bg-shell text-shell-ink font-bold' : 'text-ink hover:bg-inset font-medium'"
          :aria-current="isActive(tab.match) ? 'page' : undefined"
        >{{ tab.name }}</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.tab .tab-icon {
  transition: transform 220ms var(--ease-spring);
}
.tab:active .tab-icon {
  transform: scale(0.9);
}
</style>

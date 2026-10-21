<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * A sideways-scrolling row (filter chips, weapon types, monsters). Touch swipes as
 * usual; with a mouse the hidden part stays reachable: the wheel scrolls the row
 * sideways and a round arrow appears at each edge that has more to show. That edge
 * fades out, and the item marked aria-pressed="true" is kept in view.
 *
 * Classes and attributes land on the scrolling element itself.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  tag?: string
  /** Pass the selected value: when it changes, the selected item scrolls into view. */
  active?: unknown
}>(), { tag: 'div' })

const FADE = 64

const root = ref<HTMLElement | null>(null)
const el = ref<HTMLElement | null>(null)
const canLeft = ref(false)
const canRight = ref(false)
// Arrows line up with the row's content edge (its padding, net of any bleed margin)
const inset = ref({ left: 0, right: 0 })

function update() {
  const s = el.value
  if (!s) return
  canLeft.value = s.scrollLeft > 1
  canRight.value = s.scrollLeft < s.scrollWidth - s.clientWidth - 1
  const wrap = root.value?.getBoundingClientRect()
  if (!wrap) return
  const box = s.getBoundingClientRect()
  const css = getComputedStyle(s)
  inset.value = {
    left: Math.max(0, box.left - wrap.left + (parseFloat(css.paddingLeft) || 0)),
    right: Math.max(0, wrap.right - box.right + (parseFloat(css.paddingRight) || 0)),
  }
}

const behavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

function page(dir: 1 | -1) {
  const s = el.value
  if (s) s.scrollBy({ left: dir * s.clientWidth * 0.8, behavior: behavior() })
}

// A vertical wheel over the row scrolls it sideways while it can still move that way;
// at either end the page (or sheet) scrolls as normal. Sideways trackpad swipes pass through.
function onWheel(e: WheelEvent) {
  const s = el.value
  if (!s || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
  const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
  if ((delta > 0 && !canRight.value) || (delta < 0 && !canLeft.value)) return
  e.preventDefault()
  s.scrollLeft += delta
}

/** Scroll just enough to show the selected item clear of the faded edge. */
function reveal(smooth: boolean) {
  const s = el.value
  const item = s?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!s || !item || s.scrollWidth <= s.clientWidth) return
  const box = s.getBoundingClientRect()
  const r = item.getBoundingClientRect()
  const fadeL = inset.value.left + FADE
  const fadeR = inset.value.right + FADE
  let left = 0
  if (r.left < box.left + fadeL) left = r.left - box.left - fadeL
  else if (r.right > box.right - fadeR) left = r.right - box.right + fadeR
  if (left) s.scrollBy({ left, behavior: smooth ? behavior() : 'auto' })
}

watch(() => props.active, () => nextTick(() => reveal(true)))

// Widths change with fonts, images and slot content, so watch the row and each item.
let resize: ResizeObserver | undefined
let mutation: MutationObserver | undefined
function observeItems() {
  const s = el.value
  if (!s || !resize) return
  resize.disconnect()
  resize.observe(s)
  for (const child of s.children) resize.observe(child)
}

onMounted(() => {
  const s = el.value
  if (!s) return
  s.addEventListener('wheel', onWheel, { passive: false })
  resize = new ResizeObserver(update)
  mutation = new MutationObserver(() => {
    observeItems()
    update()
  })
  mutation.observe(s, { childList: true })
  observeItems()
  update()
  reveal(false)
})

onBeforeUnmount(() => {
  el.value?.removeEventListener('wheel', onWheel)
  resize?.disconnect()
  mutation?.disconnect()
})
</script>

<template>
  <div ref="root" class="relative min-w-0">
    <component
      :is="tag"
      ref="el"
      v-bind="$attrs"
      class="strip"
      :class="{ 'fade-l': canLeft, 'fade-r': canRight }"
      :style="{ '--inset-l': `${inset.left}px`, '--inset-r': `${inset.right}px` }"
      @scroll.passive="update"
    >
      <slot />
    </component>
    <Transition name="arrow">
      <button
        v-if="canLeft"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="arrow"
        :style="{ left: `${inset.left}px` }"
        @click="page(-1)"
      >
        <ChevronLeft :size="20" :stroke-width="2.25" />
      </button>
    </Transition>
    <Transition name="arrow">
      <button
        v-if="canRight"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="arrow"
        :style="{ right: `${inset.right}px` }"
        @click="page(1)"
      >
        <ChevronRight :size="20" :stroke-width="2.25" />
      </button>
    </Transition>
  </div>
</template>

<style scoped>
/* The edge with more to show fades into whatever sits behind the row: a short fade
   for touch, a longer one under the arrow for mouse and trackpad */
.strip {
  --fade-l: 40px;
  --fade-r: 40px;
}
@media (hover: hover) and (pointer: fine) {
  .strip {
    --fade-l: calc(var(--inset-l) + 64px);
    --fade-r: calc(var(--inset-r) + 64px);
  }
}
.fade-l {
  mask-image: linear-gradient(to right, transparent, #000 var(--fade-l));
}
.fade-r {
  mask-image: linear-gradient(to left, transparent, #000 var(--fade-r));
}
.fade-l.fade-r {
  mask-image: linear-gradient(to right, transparent, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent);
}

/* Arrows are for mouse and trackpad; touch screens just swipe */
.arrow {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-top: -1.25rem;
  border-radius: 9999px;
  background: var(--inset);
  color: var(--ink);
  transition: transform 160ms var(--ease-out-quint), opacity 160ms var(--ease-out-quint);
}
.arrow:hover {
  background: var(--rule);
}
.arrow:active {
  transform: scale(0.92);
}
@media (hover: hover) and (pointer: fine) {
  .arrow {
    display: flex;
  }
}
.arrow-enter-from,
.arrow-leave-to {
  opacity: 0;
}
</style>

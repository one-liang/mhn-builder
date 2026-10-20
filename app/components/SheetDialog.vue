<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { AnimatePresence, motion } from 'motion-v'

/**
 * Bottom sheet on phones, centred card on wide screens. Owns the overlay,
 * Escape handling, scroll lock, and focus return. Rises on a spring
 * (transform/opacity only; reduced motion is honoured by MotionConfig in app.vue).
 */
const props = defineProps<{
  open: boolean
  title: string
  /** Size to the content (short forms) instead of a near-full-height sheet. */
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'dismiss'): void
}>()

const panel = ref<{ $el?: HTMLElement } | HTMLElement | null>(null)
const panelEl = () => {
  const p = panel.value
  return (p && '$el' in p ? p.$el : p) as HTMLElement | null | undefined
}
let returnFocus: HTMLElement | null = null
const titleId = useId()

// Phones slide the sheet up from the edge; wide screens lift the card into place
const wide = ref(false)
onMounted(() => {
  const media = window.matchMedia('(min-width: 768px)')
  wide.value = media.matches
  media.addEventListener('change', e => (wide.value = e.matches))
})
const hidden = computed(() => (wide.value ? { opacity: 0, y: 24, scale: 0.98 } : { opacity: 1, y: '100%', scale: 1 }))
const spring = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 } as const

function dismiss() {
  emit('dismiss')
  emit('update:open', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) dismiss()
}

watch(() => props.open, async (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) {
    returnFocus = document.activeElement as HTMLElement | null
    document.documentElement.style.overflow = 'hidden'
    await nextTick()
    const el = panelEl()
    // On touch screens, focusing the search box would throw up the keyboard over the list.
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const first = finePointer ? el?.querySelector<HTMLElement>('[data-autofocus]') : null
    ;(first ?? el)?.focus({ preventScroll: true })
    el?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'center' })
  } else {
    document.documentElement.style.overflow = ''
    returnFocus?.focus?.({ preventScroll: true })
    returnFocus = null
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (import.meta.client) document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        key="sheet"
        class="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
        :initial="{ opacity: 1 }"
        :exit="{ opacity: 1, transition: { duration: 0.32 } }"
      >
        <motion.div
          class="absolute inset-0 bg-black/50"
          aria-hidden="true"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.2 }"
          @click="dismiss"
        />

        <motion.div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          class="relative flex flex-col w-full md:max-w-xl md:mx-6 bg-ground rounded-t-[28px] md:rounded-[28px] overflow-hidden outline-none"
          :class="compact ? 'max-h-[92dvh] md:max-w-md' : 'h-[92dvh] md:h-[82dvh]'"
          style="box-shadow: var(--sheet-shadow)"
          :initial="hidden"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="hidden"
          :transition="spring"
        >
          <span class="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-rule" aria-hidden="true" />
          <div class="flex items-center gap-2 pt-5 pb-3 pl-5 pr-3 flex-shrink-0">
            <h2 :id="titleId" class="flex-1 min-w-0 truncate text-[22px] font-black">{{ title }}</h2>
            <slot name="title-extra" />
            <button
              type="button"
              class="flex items-center justify-center size-10 rounded-full bg-inset text-ink hover:bg-rule"
              aria-label="關閉"
              @click="dismiss"
            >
              <X :size="18" :stroke-width="2.25" aria-hidden="true" />
            </button>
          </div>

          <div v-if="$slots.controls" class="flex-shrink-0 pb-1">
            <slot name="controls" />
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="flex-shrink-0 border-t border-rule bg-ground px-4 pt-3"
            style="padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px))"
          >
            <slot name="footer" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>

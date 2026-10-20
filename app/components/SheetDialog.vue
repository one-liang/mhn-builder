<script setup lang="ts">
import { X } from 'lucide-vue-next'

/**
 * Bottom sheet on phones, centred panel on wide screens. Owns the overlay,
 * Escape handling, scroll lock, and focus return.
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

const panel = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null
const titleId = useId()

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
    // On touch screens, focusing the search box would throw up the keyboard over the list.
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const first = finePointer ? panel.value?.querySelector<HTMLElement>('[data-autofocus]') : null
    ;(first ?? panel.value)?.focus({ preventScroll: true })
    panel.value?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'center' })
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
    <Transition name="sheet">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
      >
        <div class="sheet-scrim absolute inset-0 bg-[#0B1219]/60" aria-hidden="true" @click="dismiss" />

        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          class="sheet-panel relative flex flex-col w-full md:max-w-xl md:mx-6 bg-panel rounded-t-[6px] md:rounded-md overflow-hidden outline-none"
          :class="compact ? 'max-h-[92dvh] md:max-w-md' : 'h-[92dvh] md:h-[82dvh]'"
          style="box-shadow: var(--sheet-shadow)"
        >
          <div class="flex items-center gap-2 h-14 pl-4 pr-1.5 bg-shell text-shell-ink flex-shrink-0">
            <h2 :id="titleId" class="flex-1 min-w-0 truncate text-[16px] font-bold">{{ title }}</h2>
            <slot name="title-extra" />
            <button
              type="button"
              class="flex items-center justify-center size-11 rounded-sm text-shell-ink-2 hover:text-shell-ink hover:bg-shell-raised transition-colors duration-200"
              aria-label="關閉"
              @click="dismiss"
            >
              <X :size="20" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>

          <div v-if="$slots.controls" class="flex-shrink-0 border-b border-rule bg-panel">
            <slot name="controls" />
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="flex-shrink-0 border-t border-rule bg-panel px-4 pt-3"
            style="padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px))"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 240ms var(--ease-out-quint);
}
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform 320ms var(--ease-out-quint);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(24px);
}
</style>

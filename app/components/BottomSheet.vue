<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  title: string
  eyebrow?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const panel = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
const scrollLocked = useScrollLock(bodyEl)

watch(
  () => props.open,
  async (isOpen) => {
    scrollLocked.value = isOpen
    if (isOpen) {
      await nextTick()
      panel.value?.focus()
    }
  }
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => {
  bodyEl.value = document.body
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  scrollLocked.value = false
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet" :duration="{ enter: 300, leave: 200 }">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div
          class="sheet-backdrop absolute inset-0 bg-[oklch(0.12_0.012_255/0.62)] backdrop-blur-[2px]"
          @click="emit('close')"
        />

        <div
          ref="panel"
          tabindex="-1"
          class="sheet-panel relative flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl border-t border-border bg-background shadow-2xl outline-none sm:mx-4 sm:h-[80dvh] sm:max-w-lg sm:rounded-lg sm:border"
        >
          <!-- Grab handle (mobile) -->
          <div class="flex justify-center pt-2 sm:hidden" aria-hidden="true">
            <span class="h-1 w-10 rounded-full bg-border-strong" />
          </div>

          <header class="flex items-start justify-between gap-3 px-4 pt-2 sm:pt-5">
            <div class="min-w-0 pt-1">
              <p v-if="eyebrow" class="eyebrow mb-2 text-primary">{{ eyebrow }}</p>
              <h2 class="font-display text-xl font-black leading-tight text-foreground">{{ title }}</h2>
            </div>
            <div class="-mr-2 flex flex-shrink-0 items-center gap-1">
              <slot name="header-actions" />
              <button
                type="button"
                class="flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="關閉"
                @click="emit('close')"
              >
                <X class="size-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div v-if="$slots.toolbar" class="flex flex-col gap-2 border-b border-border px-4 pb-3 pt-3">
            <slot name="toolbar" />
          </div>

          <div class="flex-1 overflow-y-auto overscroll-contain">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active .sheet-backdrop,
.sheet-leave-active .sheet-backdrop {
  transition: opacity 200ms ease;
}
.sheet-enter-from .sheet-backdrop,
.sheet-leave-to .sheet-backdrop {
  opacity: 0;
}
.sheet-enter-active .sheet-panel {
  transition: transform 300ms var(--ease-out-quart), opacity 300ms var(--ease-out-quart);
}
.sheet-leave-active .sheet-panel {
  transition: transform 200ms ease-in, opacity 200ms ease-in;
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .sheet-enter-from .sheet-panel,
  .sheet-leave-to .sheet-panel {
    transform: translateY(12px) scale(0.98);
    opacity: 0;
  }
}
</style>

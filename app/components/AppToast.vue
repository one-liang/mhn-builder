<script setup lang="ts">
import { Download, RotateCcw } from 'lucide-vue-next'

const { toast, dismiss } = useToast()

function runAction() {
  toast.value?.action?.run()
  dismiss()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="toast"
        :key="toast.id"
        class="fixed z-[110] left-1/2 -translate-x-1/2 bottom-[calc(140px+env(safe-area-inset-bottom,0px))] lg:bottom-8 flex items-center gap-1 pl-4 pr-0.5 h-12 max-w-[calc(100vw-32px)] rounded-sm bg-shell text-shell-ink text-[14px] font-medium"
        style="box-shadow: var(--pop-shadow)"
        role="status"
      >
        <span class="pr-2 truncate">{{ toast.message }}</span>
        <button
          v-if="toast.action"
          type="button"
          class="flex items-center gap-1.5 h-11 px-3 rounded-sm text-shell-ink font-bold hover:bg-shell-raised flex-shrink-0"
          @click="runAction"
        >
          <RotateCcw v-if="toast.action.icon === 'undo'" :size="15" :stroke-width="2.25" aria-hidden="true" />
          <Download v-else-if="toast.action.icon === 'download'" :size="15" :stroke-width="2.25" aria-hidden="true" />
          {{ toast.action.label }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 240ms var(--ease-out-quint), transform 240ms var(--ease-out-quint);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>

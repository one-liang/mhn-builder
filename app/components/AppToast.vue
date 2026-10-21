<script setup lang="ts">
import { Download, RotateCcw } from 'lucide-vue-next'
import { AnimatePresence, motion } from 'motion-v'

const { toast, dismiss } = useToast()

function runAction() {
  toast.value?.action?.run()
  dismiss()
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed z-[110] inset-x-0 bottom-[calc(148px+env(safe-area-inset-bottom,0px))] lg:bottom-8 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        <motion.div
          v-if="toast"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-1 pl-5 pr-1.5 h-14 max-w-full rounded-full bg-shell text-shell-ink text-[15px] font-medium"
          style="box-shadow: var(--pop-shadow)"
          role="status"
          :initial="{ opacity: 0, y: 24, scale: 0.96 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="{ opacity: 0, y: 12, scale: 0.98 }"
          :transition="{ type: 'spring', stiffness: 520, damping: 34 }"
        >
          <span class="pr-2 truncate">{{ toast.message }}</span>
          <button
            v-if="toast.action"
            type="button"
            class="flex items-center gap-1.5 h-11 px-4 rounded-full bg-shell-raised text-shell-ink font-bold flex-shrink-0"
            @click="runAction"
          >
            <RotateCcw v-if="toast.action.icon === 'undo'" :size="15" :stroke-width="2.25" aria-hidden="true" />
            <Download v-else-if="toast.action.icon === 'download'" :size="15" :stroke-width="2.25" aria-hidden="true" />
            {{ toast.action.label }}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  </Teleport>
</template>

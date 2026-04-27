<script setup lang="ts">
import { useBuildStore } from '~/stores/build'

const buildStore = useBuildStore()

const entries = computed(() => buildStore.skillSummary)
const isEmpty = computed(() => entries.value.length === 0)
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-foreground">技能合計</h2>
      <span v-if="!isEmpty" class="text-[11px] text-muted-foreground">
        {{ entries.length }} 項技能
      </span>
    </div>

    <div
      v-if="isEmpty"
      class="rounded-lg border border-dashed border-border/60 bg-card/40 p-6 text-center"
    >
      <p class="text-sm text-muted-foreground">尚未選擇裝備，開始組合你的配裝吧！</p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="flex items-center gap-3 p-2.5 rounded-lg bg-card/60 border border-border"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-foreground truncate">{{ entry.name }}</span>
            <span class="text-xs font-semibold text-primary ml-2 flex-shrink-0">Lv{{ entry.total }}</span>
          </div>
          <div class="flex gap-1 mt-1.5" aria-hidden="true">
            <span
              v-for="i in entry.max"
              :key="i"
              class="inline-block w-2.5 h-2.5 rounded-full border"
              :class="i <= entry.total
                ? 'bg-primary border-primary'
                : 'bg-transparent border-border'"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

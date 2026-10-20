<script setup lang="ts">
/**
 * A moved route on a static host: the prerendered page carries a meta refresh to the
 * new address (works without JS), and the app replaces the route as soon as it runs.
 */
const props = defineProps<{
  to: string
  label: string
}>()

const config = useRuntimeConfig()
const href = `${config.app.baseURL.replace(/\/$/, '')}${props.to}`

useHead({
  meta: [{ 'http-equiv': 'refresh', content: `0; url=${href}` }],
  link: [{ rel: 'canonical', href }],
})

if (import.meta.client) navigateTo(props.to, { replace: true })
</script>

<template>
  <p class="px-4 py-16 text-center text-[15px] text-ink-2">
    正在前往<NuxtLink :to="to" class="mx-1 font-bold text-ink underline underline-offset-4">{{ label }}</NuxtLink>…
  </p>
</template>

/**
 * Page changes cross-fade through the View Transitions API, but not while the first
 * page hydrates. Nuxt would otherwise start a transition for the initial navigation and
 * for the trailing-slash fix-ups it makes while hydrating a prerendered page
 * (/skills/ → /skills → /skills/), each held until `page:finish`; that can outlast the
 * browser's DOM-update timeout and freeze the first paint on a snapshot.
 * So transitions are off in nuxt.config (`app.viewTransition`) and this guard turns them
 * on only for real page changes after hydration.
 */
export default defineNuxtPlugin((nuxtApp) => {
  let hydrated = false
  nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
    hydrated = true
  })
  const path = (p: string) => p.replace(/\/+$/, '') || '/'
  useRouter().beforeEach((to, from) => {
    if (hydrated && from.matched.length && path(to.path) !== path(from.path)) to.meta.viewTransition = true
  })
})

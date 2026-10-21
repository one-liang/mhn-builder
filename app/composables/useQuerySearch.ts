/**
 * A search box value kept in the URL's ?q= so links (such as the site search's
 * "see all") can open a list already filtered. Typing replaces the history entry.
 *
 * Pages are prerendered without a query, so while hydrating the value starts empty
 * and picks up ?q= once mounted; client-side navigation reads it straight away.
 */
export function useQuerySearch(key = 'q') {
  const route = useRoute()
  const router = useRouter()
  const nuxtApp = useNuxtApp()
  const read = () => (typeof route.query[key] === 'string' ? route.query[key] as string : '')
  const value = ref(import.meta.client && !nuxtApp.isHydrating ? read() : '')

  onMounted(() => {
    if (read() !== value.value) value.value = read()
  })
  watch(() => route.query[key], () => {
    if (read() !== value.value) value.value = read()
  })
  watch(value, (v) => {
    if (v === read()) return
    const query = { ...route.query }
    if (v) query[key] = v
    else delete query[key]
    router.replace({ query })
  })
  return value
}

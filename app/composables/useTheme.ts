/**
 * Light/dark: follows the system until the player picks one with the header switch,
 * which is then remembered in the `mhn-theme-choice` cookie. (The older `mhn-theme`
 * cookie recorded the system setting on first visit, so it is ignored.)
 */
export const useTheme = () => {
  const themeCookie = useCookie<'light' | 'dark' | null>('mhn-theme-choice', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  const systemDark = useState('theme-system-dark', () => false)

  const isDark = computed(() => (themeCookie.value ? themeCookie.value === 'dark' : systemDark.value))

  function applyTheme(dark: boolean) {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#FFFFFF')
    }
  }

  function toggle() {
    themeCookie.value = isDark.value ? 'light' : 'dark'
    applyTheme(isDark.value)
  }

  function init() {
    if (!import.meta.client) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = media.matches
    media.addEventListener('change', (e) => {
      systemDark.value = e.matches
      if (!themeCookie.value) applyTheme(e.matches)
    })
    applyTheme(isDark.value)
  }

  return { isDark, toggle, init }
}

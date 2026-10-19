export const useTheme = () => {
  const themeCookie = useCookie<'light' | 'dark'>('mhn-theme', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const isDark = computed(() => themeCookie.value === 'dark')

  function applyTheme(dark: boolean) {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      // Keep the browser chrome on the shell band's colour
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#13263A' : '#182C42')
    }
  }

  function toggle() {
    const newDark = !isDark.value
    themeCookie.value = newDark ? 'dark' : 'light'
    applyTheme(newDark)
  }

  function init() {
    if (!import.meta.client) return
    if (!themeCookie.value) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      themeCookie.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme(themeCookie.value === 'dark')
  }

  return { isDark, toggle, init }
}

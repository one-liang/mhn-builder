export const useTheme = () => {
  const themeCookie = useCookie<'light' | 'dark'>('mhn-theme', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const isDark = computed(() => themeCookie.value === 'dark')

  function applyTheme(dark: boolean) {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
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

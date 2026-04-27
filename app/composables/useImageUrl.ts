export function useImageUrl() {
  const config = useRuntimeConfig()

  function imageUrl(path: string | undefined | null): string {
    if (!path) return ''
    const base = config.app.baseURL.replace(/\/$/, '')
    return `${base}${path}`
  }

  return { imageUrl }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// Apply the theme before first paint so dark-mode visitors never see a light flash:
// the player's saved choice if any, otherwise the system setting.
const themeBootstrap = `(function(){try{var m=document.cookie.match(/(?:^|; )mhn-theme-choice=([^;]*)/);var t=m?decodeURIComponent(m[1]):null;var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);var tc=document.querySelector('meta[name=theme-color]');if(tc)tc.setAttribute('content',d?'#000000':'#FFFFFF');}catch(e){}})()`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: ['shadcn-nuxt', '@pinia/nuxt', '@vueuse/nuxt'],
  experimental: {
    viewTransition: true,
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    viewTransition: true,
    head: {
      htmlAttrs: { lang: 'zh-Hant-TW' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#FFFFFF' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Sans+TC:wght@400;500;700;900&display=swap',
        },
      ],
      script: [{ innerHTML: themeBootstrap, tagPosition: 'head' }],
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      // '/' only forwards to /build, so every top-level page is listed as a crawl entry
      routes: ['/', '/build', '/armor', '/weapons', '/skills', '/my-builds', '/driftstones'],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
  },
  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },
})

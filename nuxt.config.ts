// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// Apply the saved theme before first paint so dark-mode visitors never see a light flash.
const themeBootstrap = `(function(){try{var m=document.cookie.match(/(?:^|; )mhn-theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):null;var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);var tc=document.querySelector('meta[name=theme-color]');if(tc)tc.setAttribute('content',d?'#13263A':'#182C42');}catch(e){}})()`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: ['shadcn-nuxt', '@pinia/nuxt', '@vueuse/nuxt'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'zh-Hant-TW' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#182C42' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Noto+Sans+TC:wght@400;500;700;900&display=swap',
        },
      ],
      script: [{ innerHTML: themeBootstrap, tagPosition: 'head' }],
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
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

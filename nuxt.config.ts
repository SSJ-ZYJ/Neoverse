import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';

const criticalShellStyles = `
html {
  min-width: 320px;
  background: #050b14;
  color-scheme: dark;
}
body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: #050b14;
  color: #f4f8fc;
}
.skip-link {
  position: fixed;
  top: 1rem;
  left: 1rem;
  transform: translateY(-200%);
}
#__nuxt [inert] {
  display: none;
}
.dashboard-loading {
  position: fixed;
  z-index: 120;
  inset: 0;
  overflow: hidden;
  background: #050b14;
}
.dashboard-loading__label {
  position: absolute;
  top: 50%;
  left: 50%;
  color: #b5c5d5;
  font: 600 0.875rem/1.5 Inter, system-ui, sans-serif;
  letter-spacing: 0.02em;
  transform: translate(-50%, -50%);
}
`;

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'zh-CN', language: 'zh-CN', name: '简体', file: 'zh-CN.json' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'neoverse_locale',
      redirectOn: 'all',
      fallbackLocale: 'en',
    },
  },
  vite: {
    plugins: [tailwindcss(), Icons({ compiler: 'vue3' })],
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  runtimeConfig: {
    githubToken: '',
    public: {
      siteUrl: 'https://shenshijun.space',
    },
  },
  app: {
    head: {
      htmlAttrs: { 'data-theme': 'dark' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#050b14' },
        { name: 'color-scheme', content: 'dark' },
      ],
      link: [{ rel: 'icon', href: 'https://assets.shenshijun.space/avatar.png', type: 'image/png' }],
      style: [{ id: 'neoverse-critical-shell', textContent: criticalShellStyles }],
    },
  },
});

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
.app-view-background {
  position: fixed;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.app-view-background .home-cosmos__fallback {
  position: absolute;
  z-index: 0;
  top: 50%;
  left: 50%;
  display: block;
  width: max(calc(136.604vw * 1.05), calc(214.837vh * 1.05));
  max-width: none;
  height: auto;
  background: #020812;
  transform: translate(calc(-50% - 0.069%), calc(-50% + 11.694%));
}
.app-view-background .home-cosmos__fallback-shade {
  position: absolute;
  z-index: 1;
  inset: 0;
  background:
    radial-gradient(circle 42vw at 82% 20%, rgb(50 170 235 / 7.5%), rgb(13 96 160 / 0%) 100%),
    linear-gradient(90deg, rgb(2 8 18 / 82%), rgb(2 8 18 / 34%) 50%, rgb(2 8 18 / 8%)),
    linear-gradient(0deg, rgb(1 5 12 / 48%), rgb(1 5 12 / 6%) 32%, rgb(1 5 12 / 8%));
  pointer-events: none;
}
.app-view-background .home-cosmos {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
.city-backdrop {
  position: fixed;
  z-index: 1;
  inset: 0;
  overflow: hidden;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}
.city-backdrop--active {
  visibility: visible;
  opacity: 1;
}
.city-backdrop__track,
.city-backdrop__camera,
.city-backdrop__overlay {
  position: absolute;
  inset: 0;
}
.city-backdrop__track {
  transform: scale(var(--city-motion-initial-scale, 1.05));
  transform-origin: center;
}
.city-backdrop__camera {
  background: var(--section-orbit-image, url('/images/other-city.webp')) center / cover no-repeat;
}
.city-backdrop__overlay {
  background: var(
    --section-orbit-overlay,
    linear-gradient(180deg, rgb(2 8 18 / 46%), rgb(2 8 18 / 76%))
  );
}
.dashboard-loading {
  position: fixed;
  z-index: 120;
  inset: 0;
  overflow: hidden;
  background: #050b14;
}
.dashboard-loading--orbit {
  background: transparent;
}
.dashboard-loading--home {
  background: transparent;
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
  routeRules: {
    '/images/**': {
      headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=2592000' },
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
      link: [
        { rel: 'icon', href: 'https://assets.shenshijun.space/avatar.png', type: 'image/png' },
        { rel: 'preload', href: '/images/other-city.webp', as: 'image', type: 'image/webp', fetchpriority: 'high' },
      ],
      style: [{ id: 'neoverse-critical-shell', textContent: criticalShellStyles }],
    },
  },
});

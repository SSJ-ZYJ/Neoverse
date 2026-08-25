<script setup lang="ts">
import type { Component } from 'vue';
import { getHomeLinkEntryDelay, getHomeStatusEntryDelay, HOME_LINKS, SITE } from '#shared/constants';
import IconLucideFileText from '~icons/lucide/file-text';
import IconLucideMail from '~icons/lucide/mail';
import IconLucidePenLine from '~icons/lucide/pen-line';
import IconLucideTerminal from '~icons/lucide/terminal';
import IconSimpleIconsBilibili from '~icons/simple-icons/bilibili';
import IconSimpleIconsGithub from '~icons/simple-icons/github';

const LINK_ICONS: Record<string, Component> = {
  'lucide:file-text': IconLucideFileText,
  'lucide:mail': IconLucideMail,
  'lucide:pen-line': IconLucidePenLine,
  'lucide:terminal': IconLucideTerminal,
  'simple-icons:bilibili': IconSimpleIconsBilibili,
  'simple-icons:github': IconSimpleIconsGithub,
};

const props = withDefaults(defineProps<{ skeleton?: boolean }>(), { skeleton: false });
const { t } = useI18n();
const avatarLoaded = ref(false);
const avatarImg = ref<HTMLImageElement | null>(null);
const homeStatusStyle = {
  '--home-status-entry-delay': `${getHomeStatusEntryDelay(HOME_LINKS.length)}ms`,
};
const getHomeLinkStyle = (index: number) => ({
  '--home-link-entry-delay': `${getHomeLinkEntryDelay(index)}ms`,
});

onMounted(() => {
  if (props.skeleton) return;
  const img = avatarImg.value;
  if (img?.complete && img.naturalWidth > 0) avatarLoaded.value = true;
});
</script>

<template>
  <section
    :id="skeleton ? undefined : 'home'"
    class="dashboard-panel home-panel"
    :class="{ 'home-panel--skeleton': skeleton }"
    :aria-labelledby="skeleton ? undefined : 'home-title'"
    :aria-hidden="skeleton || undefined"
  >
    <div class="home-panel__shade" aria-hidden="true" />

    <header class="home-panel__header">
      <span v-if="skeleton" class="home-brand home-brand--skeleton" aria-hidden="true">
        <span class="home-brand__mark skeleton-surface" />
        <span class="home-skeleton-measure">Neoverse</span>
      </span>
      <NuxtLink v-else class="home-brand" to="/" aria-label="Neoverse home">
        <span class="home-brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" focusable="false">
            <defs>
              <linearGradient id="home-logo-left" x1="5.5" y1="5" x2="11" y2="27" gradientUnits="userSpaceOnUse">
                <stop stop-color="#35f4d9" />
                <stop offset="0.48" stop-color="#17dfd1" />
                <stop offset="1" stop-color="#08bfc8" />
              </linearGradient>
              <linearGradient id="home-logo-right" x1="23" y1="6" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                <stop stop-color="#169ef6" />
                <stop offset="0.52" stop-color="#086ce9" />
                <stop offset="1" stop-color="#123cc7" />
              </linearGradient>
              <linearGradient id="home-logo-fold" x1="8" y1="11" x2="24" y2="28" gradientUnits="userSpaceOnUse">
                <stop stop-color="#075a83" />
                <stop offset="0.38" stop-color="#063f96" />
                <stop offset="1" stop-color="#092cae" />
              </linearGradient>
              <linearGradient id="home-logo-ribbon" x1="7" y1="7" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                <stop stop-color="#2ff2d5" />
                <stop offset="0.34" stop-color="#16dce0" />
                <stop offset="0.7" stop-color="#087cf5" />
                <stop offset="1" stop-color="#1252e8" />
              </linearGradient>
              <linearGradient id="home-logo-gloss" x1="8" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                <stop stop-color="#e6fffb" stop-opacity="0.88" />
                <stop offset="0.42" stop-color="#91efff" stop-opacity="0.42" />
                <stop offset="1" stop-color="#92bcff" stop-opacity="0.06" />
              </linearGradient>
              <filter id="home-logo-shadow" x="-35%" y="-30%" width="170%" height="180%">
                <feDropShadow dx="0" dy="0.8" stdDeviation="0.9" flood-color="#006cff" flood-opacity="0.48" />
              </filter>
            </defs>
            <g filter="url(#home-logo-shadow)">
              <rect
                x="4.2"
                y="4.35"
                width="7.5"
                height="23.3"
                rx="3.75"
                fill="url(#home-logo-left)"
                stroke="#8affef"
                stroke-opacity="0.68"
                stroke-width="0.45"
              />
              <rect
                x="20.45"
                y="6.25"
                width="7.35"
                height="21.35"
                rx="3.675"
                fill="url(#home-logo-right)"
                stroke="#70dcff"
                stroke-opacity="0.58"
                stroke-width="0.45"
              />
              <path d="M8.25 12.25 23.15 27.15" fill="none" stroke="url(#home-logo-fold)" stroke-linecap="round" stroke-width="7.55" />
              <path d="M8.15 8.65 24.15 24.75" fill="none" stroke="#63fff0" stroke-linecap="round" stroke-opacity="0.72" stroke-width="8.25" />
              <path d="M8.15 8.65 24.15 24.75" fill="none" stroke="url(#home-logo-ribbon)" stroke-linecap="round" stroke-width="7.55" />
              <path d="M6.85 6.75 25.4 25.45" fill="none" stroke="url(#home-logo-gloss)" stroke-linecap="round" stroke-width="0.52" />
            </g>
          </svg>
        </span>
        <span>Neoverse</span>
      </NuxtLink>
    </header>

    <div class="home-panel__content">
      <div class="home-avatar" :class="{ 'is-loading': skeleton || !avatarLoaded }">
        <span class="home-avatar__skeleton" :class="{ 'is-hidden': !skeleton && avatarLoaded }" aria-hidden="true" />
        <img
          v-if="!skeleton"
          ref="avatarImg"
          :src="SITE.avatar"
          alt=""
          width="320"
          height="320"
          :class="{ 'is-loaded': avatarLoaded }"
          @load="avatarLoaded = true"
        />
      </div>

      <div class="home-panel__copy">
        <p class="home-panel__kicker">
          <span :class="{ 'home-skeleton-measure': skeleton }">{{ t('home.tagline') }}</span>
        </p>
        <h1 :id="skeleton ? undefined : 'home-title'">
          <span :class="{ 'home-skeleton-measure': skeleton }">Shenshijun</span>
        </h1>
        <p class="home-panel__role">
          <span :class="{ 'home-skeleton-measure': skeleton }">{{ t('home.role') }}</span>
        </p>
        <p class="home-panel__bio">
          <span :class="{ 'home-skeleton-measure': skeleton }">{{ t('home.bio') }}</span>
        </p>
      </div>

      <nav class="home-socials" :aria-label="t('home.linksAria')">
        <UiGlassButton
          v-for="(link, index) in HOME_LINKS"
          :key="link.id"
          :class="{ 'skeleton-surface home-socials__skeleton-button': skeleton }"
          :href="skeleton ? undefined : link.href"
          :target="!skeleton && link.external ? '_blank' : undefined"
          :rel="skeleton ? undefined : 'noreferrer'"
          :aria-label="skeleton ? undefined : t(link.labelKey)"
          :aria-hidden="skeleton || undefined"
          :disabled="skeleton || undefined"
          :tabindex="skeleton ? -1 : undefined"
          variant="glass"
          size="lg"
          :filled-icon="link.filledIcon"
          :style="skeleton ? undefined : getHomeLinkStyle(index)"
        >
          <template #icon>
            <component :is="LINK_ICONS[link.icon]" aria-hidden="true" />
          </template>
          {{ t(link.labelKey) }}
        </UiGlassButton>
      </nav>

      <p class="home-panel__status" :style="homeStatusStyle">
        <i :class="{ 'skeleton-surface': skeleton }" aria-hidden="true" />
        <span :class="{ 'home-skeleton-measure': skeleton }">
          {{ t('home.currentlyBuilding') }} <strong>{{ t('projects.docs.title') }}</strong>
        </span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.home-panel {
  display: flex;
  min-height: 100svh;
  isolation: isolate;
  flex-direction: column;
  color: #f7fbff;
  background: #020812;
  user-select: none;
  -webkit-user-select: none;
}

.home-panel--skeleton {
  background: transparent;
}
.home-panel:not(.home-panel--skeleton) {
  background: transparent;
}
.home-panel--skeleton::before {
  display: none;
}

.home-panel__shade { position: absolute; z-index: 1; inset: 0; background: linear-gradient(90deg, rgb(2 8 18 / 48%), transparent 66%), linear-gradient(0deg, rgb(2 8 18 / 32%), transparent 48%); pointer-events: none; }
.home-panel__header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.home-panel--skeleton .home-panel__header,
.home-panel--skeleton .home-avatar,
.home-panel--skeleton .home-panel__copy,
.home-panel--skeleton .home-panel__status {
  opacity: 1;
  animation: none;
  filter: none;
  transform: none;
  will-change: auto;
}
.home-panel__header,
.home-avatar,
.home-panel__copy,
.home-socials a {
  --home-entry-x: 0rem;
  --home-entry-y: 2rem;
  --home-entry-scale: 0.96;
  opacity: 0;
  animation: home-content-enter 900ms var(--motion-ease-emphasized) both;
  animation-play-state: var(--home-entry-animation-play-state, running);
  will-change: opacity, filter, transform;
}
.home-panel__header { --home-entry-y: -1rem; --home-entry-scale: 0.985; animation-delay: 0ms; }
.home-avatar { --home-entry-x: -1.75rem; --home-entry-y: 1.25rem; --home-entry-scale: 0.9; animation-delay: 140ms; }
.home-panel__copy { --home-entry-x: 1.75rem; --home-entry-y: 1.5rem; --home-entry-scale: 0.965; animation-delay: 300ms; }
.home-socials a { animation-delay: var(--home-link-entry-delay); }
.home-panel__copy {
  animation-name: home-copy-enter;
  will-change: auto;
}
.home-socials a {
  animation-name: home-social-link-enter;
  will-change: auto;
}
@keyframes home-content-enter {
  from {
    opacity: 0;
    filter: blur(6px);
    transform: translate3d(var(--home-entry-x), var(--home-entry-y), 0) scale(var(--home-entry-scale));
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0) scale(1);
  }
}
@keyframes home-copy-enter {
  from {
    opacity: 0;
    transform: translate3d(var(--home-entry-x), var(--home-entry-y), 0) scale(var(--home-entry-scale));
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}
@keyframes home-social-link-enter {
  from {
    opacity: 0;
    filter: blur(10px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
@keyframes home-status-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}
.home-brand { display: inline-flex; align-items: center; gap: 0.58rem; color: #f7fbff; font-size: var(--text-base); font-weight: var(--weight-bold); letter-spacing: -0.02em; text-decoration: none; }
.home-brand__mark { display: inline-flex; width: 1.55rem; height: 1.55rem; flex: 0 0 auto; align-items: center; justify-content: center; }
.home-brand__mark svg { display: block; width: 100%; height: 100%; overflow: visible; }
.home-brand--skeleton { pointer-events: none; }
.home-brand--skeleton .home-brand__mark { border-radius: var(--radius-control); }
.home-skeleton-measure {
  color: transparent !important;
  border-radius: var(--radius-control);
  background:
    linear-gradient(100deg, transparent 24%, var(--skeleton-highlight) 50%, transparent 76%) 100% 0 / 200% 100%,
    var(--skeleton-fill);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  box-shadow: var(--skeleton-edge);
  animation: home-inline-skeleton-shimmer 1.25s ease-in-out infinite;
}
.home-skeleton-measure * { color: transparent !important; }
@keyframes home-inline-skeleton-shimmer {
  to { background-position: -100% 0, 0 0; }
}
.home-panel__content {
  position: relative;
  z-index: 2;
  display: grid;
  width: 100%;
  max-width: var(--home-content-max);
  flex: 1;
  grid-template-areas:
    "avatar identity"
    ". links"
    ". status";
  grid-template-columns: auto minmax(0, 1fr);
  align-content: safe center;
  column-gap: clamp(2.25rem, 4.5vw, 4.25rem);
  row-gap: 1.5rem;
  margin-inline: 0 auto;
  padding-block: clamp(1.5rem, 4vh, 3rem);
}
.home-avatar {
  position: relative;
  display: grid;
  overflow: hidden;
  grid-area: avatar;
  /* 显式锁定宽高：部分加载（动画 paused、头像未返回）时百分比高度子元素
     无法再把容器沿网格行撑开，aspect-ratio 的隐式高度做不到这一点。 */
  --home-avatar-size: clamp(6.8rem, 12vw, 9.2rem);
  width: var(--home-avatar-size);
  height: var(--home-avatar-size);
  align-self: center;
  border: 3px solid rgb(226 243 255 / 88%);
  border-radius: 24%;
  padding: 0.28rem;
  background: rgb(255 255 255 / 12%);
  box-shadow:
    0 0 0 1px rgb(72 185 242 / 36%),
    0 0 1.5rem -0.45rem rgb(56 189 248 / 28%),
    0 0 2.5rem -1.1rem rgb(61 214 166 / 16%),
    0 20px 40px -24px #000;
  transition:
    border-color var(--motion-standard) var(--motion-ease-standard),
    background var(--motion-standard) var(--motion-ease-standard),
    box-shadow var(--motion-standard) var(--motion-ease-standard);
}
.home-avatar.is-loading {
  border-color: color-mix(in srgb, var(--text-secondary) 32%, transparent);
  background: color-mix(in srgb, var(--surface-glass) 58%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent-primary) 16%, transparent),
    var(--shadow-float);
}
.home-avatar__skeleton,
.home-avatar img { grid-area: 1 / 1; }
.home-avatar__skeleton {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 20%;
  background:
    radial-gradient(circle at 32% 24%, color-mix(in srgb, var(--ambient-ice) 42%, transparent), transparent 48%),
    linear-gradient(145deg, color-mix(in srgb, var(--surface-glass) 84%, var(--background-secondary)), var(--background-secondary));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--edge-light) 34%, transparent);
  opacity: 1;
  transition: opacity var(--motion-standard) var(--motion-ease-standard);
}
.home-avatar__skeleton::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(
    105deg,
    transparent 34%,
    color-mix(in srgb, var(--text-secondary) 9%, transparent) 50%,
    transparent 66%
  );
  transform: translateX(-110%);
  animation: home-avatar-skeleton-shimmer calc(var(--motion-expressive) + var(--motion-expressive)) var(--motion-ease-standard) infinite;
}
.home-avatar__skeleton.is-hidden { opacity: 0; }
.home-avatar img { display: block; width: 100%; height: 100%; opacity: 0; border-radius: 20%; object-fit: cover; transition: opacity var(--motion-standard) var(--motion-ease-standard); }
.home-avatar img.is-loaded { opacity: 1; }
@keyframes home-avatar-skeleton-shimmer {
  to { transform: translateX(110%); }
}
.home-panel__copy { grid-area: identity; min-width: 0; align-self: center; }
.home-panel__kicker { margin: 0 0 0.6rem; color: #35dbb5; font-size: var(--text-lead); font-weight: var(--weight-bold); letter-spacing: 0.01em; }
.home-panel h1 { margin: 0; color: #fff; font-size: var(--text-display-xl); font-weight: var(--weight-display); letter-spacing: -0.065em; line-height: 0.96; text-shadow: 0 8px 28px rgb(0 0 0 / 28%); }
.home-panel__role { margin: 0.85rem 0 0; color: #65b9fa; font-size: var(--text-subtitle); font-weight: var(--weight-semibold); }
.home-panel__bio { max-width: 31rem; margin: 0.7rem 0 0; color: rgb(233 245 255 / 82%); font-size: var(--text-lead); line-height: 1.7; }
.home-socials {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  grid-area: links;
  gap: 0.65rem;
}

.home-socials a {
  animation-name: home-social-link-enter;
  will-change: auto;
}
.home-panel--skeleton .home-socials__skeleton-button {
  overflow: hidden;
  color: transparent;
  background: var(--skeleton-fill);
  box-shadow: var(--skeleton-edge);
  cursor: default;
  pointer-events: none;
}
.home-panel--skeleton .home-panel__status i {
  background: var(--skeleton-fill);
  box-shadow: var(--skeleton-edge);
}
.home-panel--skeleton .home-panel__status i::after { display: none; }
.home-panel__status { display: inline-flex; grid-area: status; align-items: center; justify-self: start; gap: 0.42rem; margin: 0; opacity: 0; color: rgb(225 240 250 / 67%); font-size: var(--text-sm); line-height: 1.4; animation: home-status-enter var(--motion-standard) var(--motion-ease-standard) var(--home-status-entry-delay) both; animation-play-state: var(--home-entry-animation-play-state, running); }
.home-panel__status i { position: relative; width: 0.42rem; height: 0.42rem; flex: 0 0 auto; border-radius: 50%; background: #36d49b; box-shadow: 0 0 0.5rem rgb(54 212 155 / 42%); }
.home-panel__status i::after { content: ""; position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; border-radius: 50%; background: rgb(54 212 155 / 88%); box-shadow: 0 0 0.55rem rgb(54 212 155 / 38%); transform: translate(-50%, -50%) scale(1); opacity: 0.9; animation: home-status-halo 1.55s cubic-bezier(0.33, 0, 0.2, 1) infinite; pointer-events: none; will-change: transform, opacity; }
@keyframes home-status-halo {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.82; }
  45% { opacity: 0.38; }
  100% { transform: translate(-50%, -50%) scale(2.14); opacity: 0; }
}
.home-panel__status strong { color: #f5fbff; font-weight: var(--weight-semibold); }

@media (max-width: 620px) {
  .home-panel__content {
    grid-template-areas:
      "avatar"
      "identity"
      "links"
      "status";
    grid-template-columns: minmax(0, 1fr);
    row-gap: 1rem;
    padding-block: clamp(0.75rem, 2vh, 1.5rem);
  }
  .home-avatar { --home-avatar-size: 6.3rem; }
  .home-panel__status { margin-top: 0.45rem; }
  .home-panel h1 { font-size: var(--text-display-xl-narrow); }
}

@media (prefers-reduced-motion: reduce) {
  .home-panel__header,
  .home-avatar,
  .home-panel__copy,
  .home-socials a,
  .home-panel__status {
    opacity: 1;
    animation: none;
    filter: none;
    transform: none;
    will-change: auto;
  }
  .home-panel__status i::after { animation: none; opacity: 0; }
  .home-avatar__skeleton::after { animation: none; }
}
</style>

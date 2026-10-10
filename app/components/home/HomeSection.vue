<script setup lang="ts">
import { UiAction, UiSkeleton, UiStatusIndicator } from '@neoverse-ui/vue';
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
  '--home-intro-link-index': index,
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
        <UiSkeleton variant="rect" radius="var(--radius-control)" class="home-brand__mark" />
      </span>
      <NuxtLink v-else class="home-brand" to="/" :aria-label="t('home.brandAria')">
        <NeoverseWordmark class="home-brand__mark" />
      </NuxtLink>
    </header>

    <div class="home-panel__content">
      <div class="home-avatar" :class="{ 'home-avatar--skeleton': skeleton || !avatarLoaded }">
        <UiSkeleton
          v-if="skeleton || !avatarLoaded"
          variant="rect"
          width="100%"
          height="100%"
          radius="24%"
          class="home-avatar__skeleton"
        />
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
          <span :class="{ 'home-skeleton-copy': skeleton }">
            <span :class="{ 'home-skeleton-measure': skeleton }">{{ t('home.tagline') }}</span>
            <UiSkeleton v-if="skeleton" variant="rect" height="100%" radius="var(--radius-control)" class="home-skeleton-copy__fill" />
          </span>
        </p>
        <h1 :id="skeleton ? undefined : 'home-title'">
          <span :class="{ 'home-skeleton-copy': skeleton }">
            <span :class="{ 'home-skeleton-measure': skeleton }">Shenshijun</span>
            <UiSkeleton v-if="skeleton" variant="rect" height="100%" radius="var(--radius-control)" class="home-skeleton-copy__fill" />
          </span>
        </h1>
        <p class="home-panel__role">
          <span :class="{ 'home-skeleton-copy': skeleton }">
            <span :class="{ 'home-skeleton-measure': skeleton }">{{ t('home.role') }}</span>
            <UiSkeleton v-if="skeleton" variant="rect" height="100%" radius="var(--radius-control)" class="home-skeleton-copy__fill" />
          </span>
        </p>
        <p class="home-panel__bio">
          <span :class="{ 'home-skeleton-copy': skeleton }">
            <span :class="{ 'home-skeleton-measure': skeleton }">{{ t('home.bio') }}</span>
            <UiSkeleton v-if="skeleton" variant="rect" height="100%" radius="var(--radius-control)" class="home-skeleton-copy__fill" />
          </span>
        </p>
      </div>

      <nav class="home-socials" :aria-label="t('home.linksAria')">
        <UiAction
          v-for="(link, index) in HOME_LINKS"
          :key="link.id"
          :as="skeleton ? 'span' : 'a'"
          :class="{ 'home-socials__skeleton-button': skeleton }"
          :href="skeleton ? undefined : link.href"
          :target="!skeleton && link.external ? '_blank' : undefined"
          :rel="skeleton ? undefined : 'noreferrer'"
          :aria-label="skeleton ? undefined : t(link.labelKey)"
          :aria-hidden="skeleton || undefined"
          :disabled="skeleton || undefined"
          :tabindex="skeleton ? -1 : undefined"
          :variant="skeleton ? 'ghost' : 'secondary'"
          :surface="skeleton ? 'none' : 'glass-subtle'"
          size="lg"
          scale="lg"
          :style="skeleton ? undefined : getHomeLinkStyle(index)"
        >
          <template #leading>
            <component
              :is="LINK_ICONS[link.icon]"
              :class="{ 'home-socials__icon--filled': link.filledIcon, 'home-socials__measure': skeleton }"
              aria-hidden="true"
            />
          </template>
          <span :class="{ 'home-socials__measure': skeleton }">{{ t(link.labelKey) }}</span>
          <template v-if="skeleton" #decoration>
            <UiSkeleton variant="rect" width="100%" height="100%" radius="inherit" class="home-socials__skeleton-fill" />
          </template>
        </UiAction>
      </nav>

      <UiStatusIndicator
        class="home-panel__status"
        :style="homeStatusStyle"
        status="success"
        :pulse="!skeleton"
        :loading="skeleton"
      >
        <span :class="{ 'home-skeleton-copy': skeleton }">
          <span :class="{ 'home-skeleton-measure': skeleton }">
            {{ t('home.currentlyBuilding') }} <strong>{{ t('home.currentlyBuildingItem') }}</strong>
          </span>
          <UiSkeleton v-if="skeleton" variant="rect" height="100%" radius="var(--radius-control)" class="home-skeleton-copy__fill" />
        </span>
      </UiStatusIndicator>
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
.home-brand { display: inline-flex; height: calc(var(--text-base) * 1.55); align-items: center; color: inherit; text-decoration: none; }
.home-brand__mark { display: block; width: calc(var(--text-base) * 8); height: auto; aspect-ratio: 2050 / 270; flex: 0 0 auto; }
.home-brand--skeleton { pointer-events: none; }
/* Hidden copy preserves localized text geometry; UiSkeleton owns the visible material and motion. */
.home-skeleton-copy { display: inline-grid; max-width: 100%; vertical-align: top; }
.home-skeleton-measure,
.home-skeleton-copy__fill { grid-area: 1 / 1; }
.home-skeleton-measure { visibility: hidden; }
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
  border-radius: 24%;
}
.home-avatar:not(.home-avatar--skeleton) {
  border: 3px solid rgb(226 243 255 / 88%);
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
.home-avatar__skeleton,
.home-avatar img { grid-area: 1 / 1; }
.home-avatar img { display: block; width: 100%; height: 100%; opacity: 0; border-radius: 20%; object-fit: cover; transition: opacity var(--motion-standard) var(--motion-ease-standard); }
.home-avatar img.is-loaded { opacity: 1; }
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
.home-socials__icon--filled {
  fill: currentColor;
  stroke: none;
}
.home-panel--skeleton .home-socials__skeleton-button {
  position: relative;
  cursor: default;
  opacity: 1;
  pointer-events: none;
  animation: none;
  filter: none;
  transform: none;
}
.home-socials__measure {
  visibility: hidden;
}
.home-socials__skeleton-fill {
  position: absolute;
  inset: 0;
}
.home-panel__status {
  grid-area: status;
  justify-self: start;
  margin: 0;
  opacity: 0;
  animation: home-status-enter var(--motion-standard) var(--motion-ease-standard) var(--home-status-entry-delay) both;
  animation-play-state: var(--home-entry-animation-play-state, running);
}
@keyframes home-status-enter {
  from { opacity: 0; }
  to { opacity: 1; }
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
}
</style>

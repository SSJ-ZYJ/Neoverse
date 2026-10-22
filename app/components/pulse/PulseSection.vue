<script setup lang="ts">
import { UiBadge, UiButton, UiNotice } from '@neoverse-ui/vue';
import { SITE } from '#shared/constants';
import type { GithubPulse } from '#shared/types/github';

const props = defineProps<{ pulse: GithubPulse; loading: boolean; error?: boolean }>();
defineEmits<{ retry: [] }>();
const { t, locale } = useI18n();

const updatedLabel = computed(() => {
  if (!props.pulse.updatedAt) return t('pulse.notUpdated');
  return t('pulse.updated', {
    date: new Intl.DateTimeFormat(locale.value, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(props.pulse.updatedAt)),
  });
});
</script>

<template>
  <section id="pulse" class="dashboard-panel pulse-panel" aria-labelledby="pulse-title" :aria-busy="loading">
    <header class="panel-header">
      <h2 id="pulse-title" class="panel-title">{{ t('pulse.title') }}</h2>
      <div class="panel-header__side pulse-panel__source">
        <UiBadge :variant="pulse.source === 'github' ? 'success' : 'neutral'" size="md">
          {{ t(`pulse.source.${pulse.source}`) }}
        </UiBadge>
        <small v-if="pulse.updatedAt">{{ updatedLabel }}</small>
      </div>
      <p class="panel-description">{{ t('pulse.description') }}</p>
    </header>

    <div class="pulse-panel__state loading-swap">
      <Transition
        name="pulse-state"
        @before-leave="($event as HTMLElement).inert = true"
        @before-enter="($event as HTMLElement).inert = false"
      >
        <UiNotice
          v-if="!loading && pulse.source === 'unavailable'"
          class="pulse-panel__notice"
          variant="warning"
          role="status"
        >
          <div class="pulse-panel__fallback">
            <p>{{ t(error ? 'pulse.error' : 'pulse.unavailable') }}</p>
            <nav class="pulse-panel__fallback-links" :aria-label="t('nav.aria')">
              <NuxtLink to="/projects">{{ t('pulse.fallbackProjects') }}</NuxtLink>
              <a :href="SITE.github" target="_blank" rel="noreferrer">{{ t('pulse.fallbackGithub') }} ↗</a>
            </nav>
          </div>
          <template #action>
            <UiButton
              variant="ghost"
              size="sm"
              :loading="loading"
              @click="$emit('retry')"
            >
              {{ t('pulse.retry') }}
            </UiButton>
          </template>
        </UiNotice>
      </Transition>

      <Transition name="pulse-state">
        <div
          v-show="loading || pulse.source !== 'unavailable'"
          class="pulse-panel__body"
          :inert="!loading && pulse.source === 'unavailable'"
          :aria-hidden="!loading && pulse.source === 'unavailable'"
        >
          <PulseContributionLandscape :contributions="pulse.contributions" :loading="loading" />
          <PulseContributionProjects
            :commits="pulse.recentCommits"
            :repository-pulse="pulse.repositoryPulse"
            :loading="loading"
          />
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
/* 常规屏幕保持紧凑；矮屏由页面自然滚动，Dock 安全区始终保留。
   标题与内容一起限宽居中，保证左缘对齐（同 Focus 页模式）。 */
.pulse-panel { display: flex; min-height: 0; flex-direction: column; }
.pulse-panel__source { justify-items: end; gap: 0.4rem; text-align: right; }
.pulse-panel__source small { color: var(--text-muted); font-size: var(--text-xs); }
.pulse-panel > .panel-header,
.pulse-panel__state { width: 100%; max-width: var(--focus-content-max); margin-inline: auto; }
.pulse-panel__body { display: flex; min-width: 0; min-height: 0; flex-direction: column; gap: clamp(1rem, 2vh, 1.25rem); }
/* Keep real glass ancestors fully opaque; only their foreground changes fade.
   The incoming state alone determines layout while the outgoing copy retires. */
.pulse-state-enter-active {
  --pulse-state-duration: var(--motion-loading-reveal);
  --pulse-state-direction: normal;
  --pulse-state-easing: var(--motion-ease-emphasized);
  transition: visibility var(--pulse-state-duration) step-start;
}
.pulse-state-leave-active {
  position: absolute;
  inset: 0 0 auto;
  --pulse-state-duration: var(--motion-loading-exit);
  --pulse-state-direction: reverse;
  --pulse-state-easing: var(--motion-ease-standard);
  transition: visibility var(--pulse-state-duration) step-end;
  pointer-events: none;
}
.pulse-state-enter-from,
.pulse-state-leave-to { visibility: hidden; }
:is(.pulse-state-enter-active, .pulse-state-leave-active) :deep(:is(.pulse-panel__fallback, .contribution-card__header-main, .contribution-card__chart > .loading-swap, .contribution-stats, .activity-column > h3, .activity-column > .loading-swap, .repository-pulse__header)) {
  animation: boot-content-reveal var(--pulse-state-duration) var(--pulse-state-easing) var(--pulse-state-direction) both;
}
@media (prefers-reduced-motion: reduce) {
  .pulse-state-enter-active,
  .pulse-state-leave-active { --pulse-state-duration: var(--motion-reduced-feedback); }
}
.pulse-panel__notice { margin-bottom: 0.9rem; }
.pulse-panel__fallback p { margin: 0; }
.pulse-panel__fallback-links { display: flex; flex-wrap: wrap; gap: 0.6rem 1.2rem; margin-top: 0.75rem; }
.pulse-panel__fallback-links a { color: var(--accent-primary); font-weight: var(--weight-semibold); text-decoration: none; }
.pulse-panel__fallback-links a:hover { text-decoration: underline; text-underline-offset: 0.2em; }
.pulse-panel__fallback-links a:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 0.2rem; border-radius: var(--radius-control-inner); }
@media (max-width: 540px) { .pulse-panel__source small { display: none; } }
</style>

<script setup lang="ts">
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
        <span class="status-chip" :class="`status-chip--${pulse.source}`">{{ t(`pulse.source.${pulse.source}`) }}</span>
        <small>{{ updatedLabel }}</small>
      </div>
      <p class="panel-description">{{ t('pulse.description') }}</p>
    </header>

    <div v-if="error && !loading && pulse.source === 'unavailable'" class="pulse-panel__notice" role="status">
      <span>{{ t('pulse.error') }}</span>
      <button type="button" @click="$emit('retry')">{{ t('pulse.retry') }}</button>
    </div>

    <div class="pulse-panel__body">
      <PulseContributionLandscape :contributions="pulse.contributions" :loading="loading" />
      <PulseContributionProjects
        :commits="pulse.recentCommits"
        :repository-pulse="pulse.repositoryPulse"
        :loading="loading"
      />
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
.pulse-panel__body { width: 100%; max-width: var(--focus-content-max); margin-inline: auto; }
.pulse-panel__body { display: flex; min-height: 0; flex-direction: column; gap: clamp(1rem, 2vh, 1.25rem); }
.status-chip--unavailable { border-color: var(--border-subtle); color: var(--text-muted); background: var(--surface-subtle); }
.pulse-panel__notice { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.9rem; border: 1px solid color-mix(in srgb, #f59e0b 28%, var(--border-subtle)); border-radius: var(--radius-control); padding: 0.75rem 1rem; color: var(--text-secondary); font-size: var(--text-md); background: color-mix(in srgb, #f59e0b 7%, var(--surface-subtle)); }
.pulse-panel__notice button { border: 0; border-radius: var(--radius-control); padding: 0.35rem 0.55rem; color: var(--accent-primary); font-size: var(--text-md); font-weight: var(--weight-bold); background: rgb(56 189 248 / 8%); cursor: pointer; }
@media (max-width: 540px) { .pulse-panel__source small { display: none; } }
</style>

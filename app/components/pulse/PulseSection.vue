<script setup lang="ts">
import { UiBadge, UiButton, UiNotice } from '@neoverse-ui/vue';
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
        <small>{{ updatedLabel }}</small>
      </div>
      <p class="panel-description">{{ t('pulse.description') }}</p>
    </header>

    <UiNotice
      v-if="error && !loading && pulse.source === 'unavailable'"
      class="pulse-panel__notice"
      variant="warning"
      role="status"
    >
      <span>{{ t('pulse.error') }}</span>
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
.pulse-panel__notice { margin-bottom: 0.9rem; }
@media (max-width: 540px) { .pulse-panel__source small { display: none; } }
</style>

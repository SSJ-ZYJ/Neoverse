<script setup lang="ts">
import { getHomeLinkEntryDelay, getHomeStatusEntryDelay, HOME_LINKS } from '#shared/constants';
import IconLucideFolderOpen from '~icons/lucide/folder-open';
import IconLucideMail from '~icons/lucide/mail';
import IconLucideTerminal from '~icons/lucide/terminal';

const { t } = useI18n();

const segmentValue = ref('preview');
const segmentOptions = computed(() => [
  { value: 'preview', label: t('design.segmented.preview') },
  { value: 'code', label: t('design.segmented.code') },
]);

const TOKEN_SWATCHES = [
  '--accent-primary',
  '--accent-secondary',
  '--aurora-fill',
  '--aurora-active-fill',
  '--surface-glass',
] as const;

const motionRows = computed(() => {
  const statusDelay = getHomeStatusEntryDelay(HOME_LINKS.length);
  const rows = [
    { id: 'header', label: t('design.motion.rows.header'), delay: 0 },
    { id: 'avatar', label: t('design.motion.rows.avatar'), delay: 140 },
    { id: 'copy', label: t('design.motion.rows.copy'), delay: 300 },
    { id: 'links', label: t('design.motion.rows.links'), delay: getHomeLinkEntryDelay(0) },
    { id: 'status', label: t('design.motion.rows.status'), delay: statusDelay },
  ];

  return rows.map((row) => ({
    ...row,
    progress: statusDelay > 0 ? Math.max(3, (row.delay / statusDelay) * 100) : 3,
  }));
});
</script>

<template>
  <section id="design" class="dashboard-panel design-panel" aria-labelledby="design-title">
    <header class="design-header">
      <p class="design-header__kicker">Neoverse</p>
      <h1 id="design-title">{{ t('design.title') }}</h1>
      <p class="design-header__desc">{{ t('design.description') }}</p>
    </header>

    <div class="design-stack">
      <section class="design-block" aria-labelledby="design-buttons-title">
        <h2 id="design-buttons-title">{{ t('design.buttons.title') }}</h2>
        <p class="design-block__hint">{{ t('design.buttons.hint') }}</p>
        <div class="design-row">
          <UiGlassButton variant="glass" size="lg">
            <template #icon><IconLucideMail aria-hidden="true" /></template>
            {{ t('design.buttons.contact') }}
          </UiGlassButton>
          <UiGlassButton variant="glass" size="lg" filled-icon>
            <template #icon><IconLucideTerminal aria-hidden="true" /></template>
            {{ t('design.buttons.overview') }}
          </UiGlassButton>
          <UiGlassButton variant="ghost" size="md">
            <template #icon><IconLucideFolderOpen aria-hidden="true" /></template>
            {{ t('design.buttons.docs') }}
          </UiGlassButton>
          <UiGlassButton variant="ghost" size="md" active>{{ t('design.buttons.overview') }}</UiGlassButton>
          <UiGlassButton variant="glass" size="sm">{{ t('design.buttons.overview') }}</UiGlassButton>
        </div>
      </section>

      <section class="design-block" aria-labelledby="design-segmented-title">
        <h2 id="design-segmented-title">{{ t('design.segmented.title') }}</h2>
        <p class="design-block__hint">{{ t('design.segmented.hint') }}</p>
        <div class="design-row">
          <div class="design-segment-well">
            <UiSegmentedControl
              v-model="segmentValue"
              :options="segmentOptions"
              :label="t('design.segmented.ariaLabel')"
            />
          </div>
        </div>
      </section>

      <section class="design-block" aria-labelledby="design-tokens-title">
        <h2 id="design-tokens-title">{{ t('design.tokens.title') }}</h2>
        <p class="design-block__hint">{{ t('design.tokens.hint') }}</p>
        <ul class="design-swatches">
          <li v-for="token in TOKEN_SWATCHES" :key="token" class="design-swatch">
            <span class="design-swatch__chip" :style="{ background: `var(${token})` }" aria-hidden="true" />
            <code>{{ token }}</code>
          </li>
        </ul>
      </section>

      <section class="design-block" aria-labelledby="design-motion-title">
        <h2 id="design-motion-title">{{ t('design.motion.title') }}</h2>
        <p class="design-block__hint">{{ t('design.motion.hint') }}</p>
        <ol class="design-motion">
          <li v-for="row in motionRows" :key="row.id" class="design-motion__row">
            <div class="design-motion__meta">
              <span class="design-motion__label">{{ row.label }}</span>
              <code>{{ t('design.motion.delay', { value: row.delay }) }}</code>
            </div>
            <div class="design-motion__rail" aria-hidden="true">
              <span
                class="design-motion__progress"
                :class="{ 'design-motion__progress--status': row.id === 'status' }"
                :style="{ width: `${row.progress}%` }"
              />
            </div>
          </li>
        </ol>
        <p class="design-motion__note">{{ t('design.motion.note') }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.design-panel {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  gap: 2rem;
}

.design-header__kicker {
  margin: 0;
  color: var(--accent-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.design-header h1 {
  margin: 0.4rem 0 0;
  color: var(--text-primary);
  font-size: var(--text-display-lg);
  letter-spacing: -0.04em;
}

.design-header__desc {
  max-width: 38rem;
  margin: 0.6rem 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.design-stack {
  display: grid;
  width: 100%;
  max-width: var(--home-content-max);
  gap: 2.25rem;
}

.design-block h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-base);
  letter-spacing: -0.01em;
}

.design-block__hint {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  font-size: var(--text-md);
}

.design-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1.1rem;
}

.design-segment-well {
  display: inline-flex;
  border: 1px solid rgb(219 234 254 / 9%);
  border-radius: var(--radius-control);
  padding: 0.22rem;
  background: rgb(255 255 255 / 3%);
}

.design-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 1.1rem 0 0;
  padding: 0;
  list-style: none;
}

.design-swatch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.design-swatch__chip {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.design-swatch code {
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.design-motion {
  display: grid;
  gap: 0.8rem;
  margin: 1.1rem 0 0;
  padding: 1rem;
  border: 1px solid var(--glass-card-border);
  border-radius: var(--radius-surface);
  background: var(--glass-card-background);
  box-shadow: var(--glass-surface-shadow);
  list-style: none;
}

.design-motion__row {
  display: grid;
  gap: 0.45rem;
}

.design-motion__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.design-motion__label {
  color: var(--text-primary);
  font-size: var(--text-md);
}

.design-motion__meta code {
  color: var(--accent-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.design-motion__rail {
  position: relative;
  height: 0.35rem;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--surface-glass) 72%, transparent);
}

.design-motion__progress {
  display: block;
  height: 100%;
  min-width: 0.35rem;
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 28%, transparent), var(--accent-primary));
}

.design-motion__progress--status {
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent-secondary) 28%, transparent), var(--accent-secondary));
}

.design-motion__note {
  max-width: 42rem;
  margin: 0.8rem 0 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}
</style>

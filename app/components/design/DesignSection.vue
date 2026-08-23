<script setup lang="ts">
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
</style>

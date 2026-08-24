<script setup lang="ts">
import { createEmptyPulse, FOCUS_DOMAINS, PROJECTS, type ViewId } from '#shared/constants';

type SkeletonView = ViewId | 'design';

defineProps<{ view: SkeletonView }>();
const { t } = useI18n();
const emptyPulse = createEmptyPulse();
</script>

<template>
  <div
    class="dashboard-loading"
    :class="{ 'dashboard-loading--orbit': view === 'projects' || view === 'focus' || view === 'pulse' }"
    role="status"
    aria-live="polite"
    :aria-label="t('common.loading')"
  >
    <span class="dashboard-loading__label">{{ t('common.loading') }}</span>
    <div class="dashboard-loading__shell">
      <HomeSection v-if="view === 'home'" skeleton />

      <section v-else-if="view === 'projects'" class="dashboard-loading__panel dashboard-loading__panel--projects">
        <div class="dashboard-loading__panel-heading dashboard-loading__panel-heading--projects">
          <div class="dashboard-loading__panel-heading-copy">
            <div class="skeleton-surface dashboard-loading__heading-line dashboard-loading__heading-line--title" />
            <div class="dashboard-loading__heading-description">
              <div class="skeleton-surface dashboard-loading__heading-line dashboard-loading__heading-line--description" />
            </div>
          </div>
        </div>

        <div class="dashboard-loading__project-list">
          <div
            v-for="project in PROJECTS"
            :key="project.id"
            class="dashboard-loading__project-card"
            :class="`dashboard-loading__project-card--${project.id}`"
          >
            <div class="dashboard-loading__project-preview">
              <div class="dashboard-loading__project-preview-frame">
                <div class="dashboard-loading__project-preview-head">
                  <span class="skeleton-surface" />
                  <span class="skeleton-surface" />
                </div>
                <div class="dashboard-loading__project-preview-rows">
                  <div
                    v-for="row in project.id === 'docs' ? 4 : 3"
                    :key="row"
                    class="dashboard-loading__project-preview-row"
                  >
                    <span
                      class="skeleton-surface dashboard-loading__project-preview-line dashboard-loading__project-preview-line--primary"
                    />
                    <span class="skeleton-surface dashboard-loading__project-preview-line" />
                  </div>
                </div>
              </div>
            </div>
            <div class="dashboard-loading__project-copy">
              <div class="dashboard-loading__project-title-row">
                <div class="skeleton-surface dashboard-loading__project-icon" />
                <div class="skeleton-surface dashboard-loading__project-line dashboard-loading__project-line--title" />
              </div>
              <div class="skeleton-surface dashboard-loading__project-line dashboard-loading__project-line--category" />
              <div class="dashboard-loading__project-description">
                <div class="skeleton-surface dashboard-loading__project-line" />
                <div class="skeleton-surface dashboard-loading__project-line dashboard-loading__project-line--description-2" />
                <div class="skeleton-surface dashboard-loading__project-line dashboard-loading__project-line--description-3" />
              </div>
            </div>
            <div class="dashboard-loading__project-footer">
              <div class="dashboard-loading__project-tags">
                <div
                  v-for="tag in project.id === 'docs' ? 6 : 4"
                  :key="tag"
                  class="skeleton-surface dashboard-loading__project-tag"
                />
              </div>
              <div class="skeleton-surface dashboard-loading__project-repo" />
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="view === 'focus'" class="dashboard-loading__panel dashboard-loading__panel--focus">
        <div class="dashboard-loading__panel-heading dashboard-loading__panel-heading--focus">
          <div class="dashboard-loading__panel-heading-copy">
            <div class="skeleton-surface dashboard-loading__heading-line dashboard-loading__heading-line--title" />
            <div class="dashboard-loading__heading-description">
              <div class="skeleton-surface dashboard-loading__heading-line dashboard-loading__heading-line--description" />
              <div class="skeleton-surface dashboard-loading__heading-line dashboard-loading__heading-line--description dashboard-loading__heading-line--description-2" />
            </div>
          </div>
        </div>

        <div class="dashboard-loading__focus-journey">
          <div class="dashboard-loading__focus-journey-bar">
            <div class="skeleton-surface dashboard-loading__focus-command" />
            <div class="skeleton-surface dashboard-loading__focus-meta" />
          </div>
          <div class="dashboard-loading__focus-journey-body">
            <div class="dashboard-loading__stage-head">
              <div class="dashboard-loading__stage-spacer" />
              <div class="dashboard-loading__stage-labels">
                <span v-for="stage in 4" :key="stage" class="skeleton-surface" />
              </div>
            </div>
            <div v-for="domain in FOCUS_DOMAINS" :key="domain.id" class="dashboard-loading__track-row">
              <div class="dashboard-loading__track-info">
                <div class="dashboard-loading__track-head">
                  <span class="skeleton-surface dashboard-loading__track-icon" />
                  <span class="skeleton-surface dashboard-loading__track-label" />
                  <span class="skeleton-surface dashboard-loading__track-stage" />
                </div>
                <div class="dashboard-loading__track-items">
                  <span v-for="item in 4" :key="item" class="skeleton-surface" />
                </div>
              </div>
              <div class="dashboard-loading__track">
                <span v-for="stage in 4" :key="stage" class="skeleton-surface dashboard-loading__track-node" />
              </div>
            </div>
          </div>
          <div class="dashboard-loading__focus-footnote">
            <span class="skeleton-surface" />
          </div>
        </div>

        <div class="dashboard-loading__focus-interests">
          <div class="dashboard-loading__focus-interests-head">
            <span class="skeleton-surface dashboard-loading__focus-interests-icon" />
            <span class="skeleton-surface dashboard-loading__focus-interests-label" />
            <span class="skeleton-surface dashboard-loading__focus-interests-hint" />
          </div>
          <div class="dashboard-loading__focus-interests-list">
            <span v-for="topic in 4" :key="topic" class="skeleton-surface" />
          </div>
        </div>
      </section>

      <section v-else-if="view === 'pulse'" class="dashboard-loading__panel dashboard-loading__panel--pulse">
        <PulseSection :pulse="emptyPulse" :loading="true" />
      </section>

      <section v-else-if="view === 'design'" class="dashboard-loading__panel dashboard-loading__panel--design">
        <header class="dashboard-loading__design-header">
          <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--kicker" />
          <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--title" />
          <div class="dashboard-loading__design-description">
            <div class="skeleton-surface dashboard-loading__design-line" />
            <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--description-2" />
          </div>
        </header>

        <div class="dashboard-loading__design-stack">
          <section class="dashboard-loading__design-block">
            <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--block-title" />
            <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--hint" />
            <div class="dashboard-loading__design-buttons">
              <span v-for="button in 5" :key="button" class="skeleton-surface" />
            </div>
          </section>

          <section class="dashboard-loading__design-block">
            <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--block-title" />
            <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--hint" />
            <div class="skeleton-surface dashboard-loading__design-segmented" />
          </section>

          <section class="dashboard-loading__design-block">
            <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--block-title" />
            <div class="skeleton-surface dashboard-loading__design-line dashboard-loading__design-line--hint" />
            <div class="dashboard-loading__design-swatches">
              <span v-for="swatch in 5" :key="swatch">
                <i class="skeleton-surface" />
                <b class="skeleton-surface" />
              </span>
            </div>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-loading {
  position: fixed;
  z-index: 120;
  inset: 0;
  overflow: auto;
  padding: 0;
  background: var(--background-primary);
  scrollbar-width: none;
}

.dashboard-loading--orbit { background: transparent; }

.dashboard-loading::-webkit-scrollbar { display: none; width: 0; height: 0; }

.dashboard-loading__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.dashboard-loading__shell {
  display: grid;
  width: 100%;
  min-height: 100svh;
  align-items: start;
  margin-inline: auto;
  grid-template-columns: 1fr;
}

.dashboard-loading__panel {
  min-height: 0;
  border: 0;
  border-radius: 0;
  padding: var(--page-block-start) var(--page-inline) var(--dock-safe-space);
  background: var(--surface-elevated);
  box-shadow: none;
}

:is(.dashboard-loading__panel--projects, .dashboard-loading__panel--focus, .dashboard-loading__panel--pulse) {
  background: transparent;
}
.dashboard-loading__panel--projects {
  display: flex;
  flex-direction: column;
}

.dashboard-loading__panel--focus {
  display: flex;
  flex-direction: column;
}

.dashboard-loading__panel--pulse {
  display: flex;
  flex-direction: column;
}
.dashboard-loading__panel--pulse > .pulse-panel { flex: 1; min-height: 0; padding: 0; background: transparent; }

.dashboard-loading__panel-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.25rem 1.2rem;
  align-items: center;
  margin-bottom: clamp(0.85rem, 1.8vw, 1.4rem);
}

.dashboard-loading__panel-heading-copy {
  display: contents;
}

.dashboard-loading__heading-line {
  border-radius: var(--radius-control);
  opacity: 0.52;
}

.dashboard-loading__heading-line--title {
  grid-column: 1;
  grid-row: 1;
  width: 10rem;
  height: clamp(1.43rem, 1.9vw, 1.98rem);
}

.dashboard-loading__heading-description {
  display: grid;
  grid-column: 1 / -1;
  grid-row: 2;
  width: 100%;
  max-width: 56rem;
  gap: 0;
}

.dashboard-loading__heading-line--description {
  width: 100%;
  height: clamp(1.22rem, 1.45vw, 1.36rem);
}

.dashboard-loading__heading-line--description-2,
.dashboard-loading__heading-line--description-3 {
  display: none;
}

.dashboard-loading__panel-heading--focus,
.dashboard-loading__focus-journey,
.dashboard-loading__focus-interests {
  width: 100%;
  max-width: var(--focus-content-max);
  margin-inline: auto;
}

.dashboard-loading__panel-heading--projects {
  width: 100%;
  max-width: var(--focus-content-max);
  margin-inline: auto;
}

.dashboard-loading__panel-heading--focus .dashboard-loading__heading-line--title { width: 7rem; }

.dashboard-loading__project-list {
  display: grid;
  flex: 1;
  align-content: start;
  width: 100%;
  max-width: var(--focus-content-max);
  margin-inline: auto;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
  gap: clamp(1rem, 1.8vw, 1.5rem);
}

.dashboard-loading__project-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--glass-border-hairline);
  border-radius: var(--radius-surface);
  background: var(--glass-card-background);
  box-shadow: var(--glass-surface-shadow);
  -webkit-backdrop-filter: var(--glass-card-filter);
  backdrop-filter: var(--glass-card-filter);
}

.dashboard-loading__project-preview {
  display: grid;
  aspect-ratio: 16 / 10;
  place-items: stretch;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding: clamp(0.55rem, 1vw, 0.85rem);
  background: var(--glass-refraction-fill), color-mix(in srgb, var(--surface-glass) 78%, transparent);
}

.dashboard-loading__project-preview-frame {
  display: flex;
  min-height: 0;
  flex-direction: column;
  border-radius: var(--radius-control);
  padding: clamp(0.85rem, 1.5vw, 1.15rem);
  background: var(--glass-card-inset-fill);
  box-shadow: inset 0 0 0 1px var(--glass-border-hairline), inset 0 1px 0 var(--glass-highlight);
}

.dashboard-loading__project-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding-bottom: 0.65rem;
}

.dashboard-loading__project-preview-head span:first-child { width: 5.4rem; height: 0.78rem; opacity: 0.52; }
.dashboard-loading__project-preview-head span:last-child { width: 7.2rem; height: 0.62rem; opacity: 0.36; }
.dashboard-loading__project-preview-rows { display: flex; min-height: 0; flex: 1; flex-direction: column; }
.dashboard-loading__project-preview-row {
  display: grid;
  min-height: 0;
  flex: 1;
  align-content: center;
  gap: 0.32rem;
  border-bottom: 1px solid var(--glass-border-hairline);
}
.dashboard-loading__project-preview-row:last-child { border-bottom: 0; }
.dashboard-loading__project-preview-line {
  display: block;
  width: 72%;
  height: 0.58rem;
  border-radius: var(--radius-control);
  opacity: 0.34;
}
.dashboard-loading__project-preview-line--primary { width: 42%; height: 0.68rem; opacity: 0.46; }

.dashboard-loading__project-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.55rem;
  padding: clamp(0.9rem, 1.3vw, 1.15rem);
}

.dashboard-loading__project-icon {
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border-radius: var(--radius-control);
  opacity: 0.55;
}

.dashboard-loading__project-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.55rem;
}

.dashboard-loading__project-line {
  width: 100%;
  height: 0.78rem;
  border-radius: var(--radius-control);
  opacity: 0.52;
}

.dashboard-loading__project-line--title { width: min(100%, 12rem); height: 1.15rem; }
.dashboard-loading__project-line--category { width: 7.4rem; height: 0.72rem; }
.dashboard-loading__project-description { display: grid; gap: 0.4rem; margin-top: 0.35rem; }
.dashboard-loading__project-line--description-2,
.dashboard-loading__project-line--description-3 { display: none; }
.dashboard-loading__project-description .dashboard-loading__project-line { height: 1.33rem; }
.dashboard-loading__project-line--description-3 { width: 68%; }
.dashboard-loading__project-card--docs .dashboard-loading__project-line--description-2 { width: 92%; }
.dashboard-loading__project-card--docs .dashboard-loading__project-tag:nth-child(1) { width: 3.9rem; }
.dashboard-loading__project-card--docs .dashboard-loading__project-tag:nth-child(2) { width: 3.4rem; }
.dashboard-loading__project-card--docs .dashboard-loading__project-tag:nth-child(3) { width: 5.2rem; }
.dashboard-loading__project-card--docs .dashboard-loading__project-tag:nth-child(4) { width: 3.05rem; }
.dashboard-loading__project-card--docs .dashboard-loading__project-tag:nth-child(5) { width: 4.6rem; }
.dashboard-loading__project-card--docs .dashboard-loading__project-tag:nth-child(6) { width: 3.7rem; }
.dashboard-loading__project-card--blog .dashboard-loading__project-tag:nth-child(1) { width: 3.3rem; }
.dashboard-loading__project-card--blog .dashboard-loading__project-tag:nth-child(2) { width: 3.8rem; }
.dashboard-loading__project-card--blog .dashboard-loading__project-tag:nth-child(3) { width: 3.6rem; }
.dashboard-loading__project-card--blog .dashboard-loading__project-tag:nth-child(4) { width: 6.2rem; }

.dashboard-loading__project-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
  border-top: 1px solid var(--glass-border-hairline);
  padding: 0.65rem clamp(0.9rem, 1.3vw, 1.15rem) clamp(0.9rem, 1.3vw, 1.15rem);
}

.dashboard-loading__project-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.dashboard-loading__project-tag { height: 1.65rem; border-radius: var(--radius-control); opacity: 0.45; }

.dashboard-loading__project-repo {
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border-radius: var(--radius-control);
  opacity: 0.45;
}

.dashboard-loading__focus-journey,
.dashboard-loading__focus-interests {
  border: 1px solid var(--glass-border-hairline);
  border-radius: var(--radius-surface);
  background: var(--glass-card-background);
  box-shadow: var(--glass-surface-shadow);
  -webkit-backdrop-filter: var(--glass-card-filter);
  backdrop-filter: var(--glass-card-filter);
}

.dashboard-loading__focus-journey {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.dashboard-loading__focus-journey-bar {
  display: flex;
  min-height: 2.85rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding: 0.72rem 1.15rem;
}

.dashboard-loading__focus-command { width: 11rem; height: 0.82rem; border-radius: var(--radius-control); opacity: 0.45; }
.dashboard-loading__focus-meta { width: 8.4rem; height: 0.72rem; border-radius: var(--radius-control); opacity: 0.35; }

.dashboard-loading__focus-journey-body {
  display: flex;
  flex-direction: column;
  padding: 0.95rem 1.35rem 0.3rem;
}

.dashboard-loading__stage-head {
  display: grid;
  grid-template-columns: minmax(14rem, 21rem) 1fr;
  gap: 1.4rem;
  padding: 0 0.4rem 0.65rem;
}

.dashboard-loading__stage-labels {
  display: grid;
  height: 1.1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.dashboard-loading__stage-labels span { width: 3.2rem; height: 0.62rem; border-radius: var(--radius-control); opacity: 0.34; }
.dashboard-loading__stage-labels span:nth-child(2),
.dashboard-loading__stage-labels span:nth-child(3) { justify-self: center; }
.dashboard-loading__stage-labels span:last-child { justify-self: end; }

.dashboard-loading__track-row {
  display: grid;
  min-height: 4.85rem;
  grid-template-columns: minmax(14rem, 21rem) 1fr;
  gap: 1.4rem;
  align-items: center;
  border-top: 1px solid var(--glass-border-hairline);
  border-radius: 0.45rem;
  padding: 0.85rem 0.4rem;
}

.dashboard-loading__track-head { display: flex; min-width: 0; align-items: center; gap: 0.55rem; }
.dashboard-loading__track-icon { width: 1.2rem; height: 1.2rem; flex: 0 0 auto; border-radius: var(--radius-control); opacity: 0.46; }
.dashboard-loading__track-label { width: min(8rem, 42%); height: 0.82rem; border-radius: var(--radius-control); opacity: 0.48; }
.dashboard-loading__track-stage { width: 4.2rem; height: 0.78rem; flex: 0 0 auto; margin-left: auto; border-radius: var(--radius-pill); opacity: 0.38; }
.dashboard-loading__track-items { display: flex; flex-wrap: wrap; gap: 0.3rem 0.5rem; margin-top: 0.45rem; }
.dashboard-loading__track-items span { width: 3.5rem; height: 0.58rem; border-radius: var(--radius-control); opacity: 0.34; }
.dashboard-loading__track-items span:nth-child(2) { width: 4.4rem; }
.dashboard-loading__track-items span:nth-child(3) { width: 3rem; }
.dashboard-loading__track-items span:nth-child(4) { width: 5rem; }

.dashboard-loading__track { position: relative; height: 2.2rem; }
.dashboard-loading__track::before { position: absolute; top: 50%; right: 0; left: 0; height: 1px; background: var(--border-subtle); content: ''; transform: translateY(-50%); }
.dashboard-loading__track-node { position: absolute; top: 50%; width: 0.6rem; height: 0.6rem; border: 2px solid var(--border-strong); border-radius: 50%; background: var(--surface-elevated); opacity: 0.5; transform: translate(-50%, -50%); }
.dashboard-loading__track-node:nth-child(1) { left: 0; transform: translate(0, -50%); }
.dashboard-loading__track-node:nth-child(2) { left: 33.333%; }
.dashboard-loading__track-node:nth-child(3) { left: 66.666%; }
.dashboard-loading__track-node:nth-child(4) { right: 0; transform: translate(0, -50%); }

.dashboard-loading__focus-footnote { min-height: 2.55rem; margin: 0; border-top: 1px solid var(--glass-border-hairline); padding: 0.65rem 1.35rem; }
.dashboard-loading__focus-footnote span { display: block; width: 14rem; max-width: 72%; height: 0.62rem; border-radius: var(--radius-control); opacity: 0.34; }

.dashboard-loading__focus-interests { margin-top: 1rem; }
.dashboard-loading__focus-interests-head { display: flex; min-height: 2.85rem; align-items: baseline; gap: 0.55rem; border-bottom: 1px solid var(--glass-border-hairline); padding: 0.72rem 1.15rem; }
.dashboard-loading__focus-interests-icon { align-self: center; width: 0.95rem; height: 0.95rem; flex: 0 0 auto; border-radius: 50%; opacity: 0.42; }
.dashboard-loading__focus-interests-label { width: 7rem; height: 0.78rem; border-radius: var(--radius-control); opacity: 0.46; }
.dashboard-loading__focus-interests-hint { width: 12rem; max-width: 42%; height: 0.62rem; border-radius: var(--radius-control); opacity: 0.28; }
.dashboard-loading__focus-interests-list { display: flex; flex-wrap: wrap; gap: 0.4rem 0.65rem; padding: 0.85rem 1.15rem 0.95rem; }
.dashboard-loading__focus-interests-list span { width: 3.8rem; height: calc(var(--text-xs) * 1.55); border-radius: var(--radius-control); opacity: 0.36; }
.dashboard-loading__focus-interests-list span:nth-child(2) { width: 3.8rem; }
.dashboard-loading__focus-interests-list span:nth-child(3) { width: 5.75rem; }
.dashboard-loading__focus-interests-list span:nth-child(4) { width: 2.4rem; }

.dashboard-loading__panel--design {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-loading__design-header,
.dashboard-loading__design-stack {
  width: 100%;
  max-width: var(--home-content-max);
}

.dashboard-loading__design-line {
  width: 100%;
  height: 0.86rem;
  border-radius: var(--radius-control);
  opacity: 0.46;
}

.dashboard-loading__design-line--kicker { width: 5.4rem; height: var(--text-sm); }
.dashboard-loading__design-line--title { width: min(16rem, 68%); height: clamp(2.2rem, 4vw, 3.3rem); margin-top: 0.4rem; }
.dashboard-loading__design-description { display: grid; width: min(100%, 38rem); gap: 0.4rem; margin-top: 0.6rem; }
.dashboard-loading__design-line--description-2 { width: 72%; }
.dashboard-loading__design-stack { display: grid; gap: 2.25rem; }
.dashboard-loading__design-block { min-width: 0; }
.dashboard-loading__design-line--block-title { width: 9rem; height: var(--text-base); }
.dashboard-loading__design-line--hint { width: min(21rem, 76%); height: var(--text-md); margin-top: 0.35rem; opacity: 0.34; }
.dashboard-loading__design-buttons { display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem; margin-top: 1.1rem; }
.dashboard-loading__design-buttons span { width: 7.2rem; height: var(--control-height-lg); border-radius: var(--radius-control); opacity: 0.5; }
.dashboard-loading__design-buttons span:nth-child(2) { width: 8.4rem; }
.dashboard-loading__design-buttons span:nth-child(3) { width: 6.4rem; height: var(--control-height-md); }
.dashboard-loading__design-buttons span:nth-child(4) { width: 7.8rem; height: var(--control-height-md); }
.dashboard-loading__design-buttons span:nth-child(5) { width: 6.8rem; height: var(--control-height-sm); }
.dashboard-loading__design-segmented { width: 11rem; height: calc(var(--control-height-md) + 0.44rem); margin-top: 1.1rem; border-radius: var(--radius-control); opacity: 0.5; }
.dashboard-loading__design-swatches { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 1.1rem; }
.dashboard-loading__design-swatches > span { display: inline-flex; align-items: center; gap: 0.5rem; }
.dashboard-loading__design-swatches i { width: 2.2rem; height: 2.2rem; border-radius: var(--radius-sm); opacity: 0.46; }
.dashboard-loading__design-swatches b { width: 7.5rem; height: var(--text-sm); border-radius: var(--radius-control); opacity: 0.3; }

@media (max-width: 900px) {
  .dashboard-loading__stage-head { grid-template-columns: 1fr; gap: 0.3rem; }
  .dashboard-loading__stage-spacer { display: none; }
  .dashboard-loading__stage-labels { margin-left: 0.5rem; }
  .dashboard-loading__track-row { min-height: 7.95rem; grid-template-columns: 1fr; gap: 0.9rem; }
  .dashboard-loading__track { margin-left: 0.5rem; }
}

@media (max-width: 700px) {
  .dashboard-loading__panel-heading { gap: 0.65rem; }
}

@media (max-width: 760px) {
  .dashboard-loading__focus-journey-bar { min-height: 2.64rem; padding: 0.62rem 0.9rem; }
  .dashboard-loading__focus-journey-body { padding: 0.95rem 0.9rem 0.2rem; }
  .dashboard-loading__focus-footnote { min-height: 2.45rem; padding: 0.6rem 0.95rem; }
  .dashboard-loading__focus-interests-head { min-height: 2.64rem; padding: 0.62rem 0.9rem; }
  .dashboard-loading__focus-interests-hint { display: none; }
  .dashboard-loading__focus-interests-list { padding: 0.8rem 0.9rem 0.9rem; }
}

@media (max-width: 620px) {
  .dashboard-loading__heading-line--description-2 { display: block; width: 92%; }
  .dashboard-loading__panel-heading--focus .dashboard-loading__heading-line--description-2 { display: none; }
  .dashboard-loading__panel-heading--projects .dashboard-loading__heading-line--description-3,
  .dashboard-loading__panel-heading--pulse .dashboard-loading__heading-line--description-3 { display: block; width: 74%; }
}

@media (max-width: 580px) {
  .dashboard-loading__project-preview { min-height: 10.5rem; }
  .dashboard-loading__project-description .dashboard-loading__project-line { height: calc(var(--text-xs) * 1.55); }
  .dashboard-loading__project-card--docs .dashboard-loading__project-line--description-2 { display: block; }
}

@media (max-width: 520px) {
  .dashboard-loading__project-preview {
    aspect-ratio: 4 / 3;
    padding: 0.45rem;
  }
  .dashboard-loading__project-preview-frame { padding: 0.65rem; }
  .dashboard-loading__project-preview-head {
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .dashboard-loading__project-copy {
    gap: 0.45rem;
    padding: 0.85rem;
  }
  .dashboard-loading__project-footer {
    gap: 0.6rem;
    padding: 0.6rem 0.85rem 0.85rem;
  }
  .dashboard-loading__project-tags { gap: 0.25rem; }
}

@media (max-width: 380px) {
  .dashboard-loading__track-row:last-child { min-height: 9.35rem; }
}

@media (max-width: 460px) {
  .dashboard-loading__focus-meta { display: none; }
}
</style>

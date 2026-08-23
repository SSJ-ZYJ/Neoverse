<script setup lang="ts">
import { createEmptyPulse, FOCUS_DOMAINS, HOME_LINKS, PROJECTS } from '#shared/constants';

defineProps<{ view: 'home' | 'projects' | 'focus' | 'pulse' }>();
const { t } = useI18n();
const emptyPulse = createEmptyPulse();
</script>

<template>
  <div class="dashboard-loading" role="status" aria-live="polite" :aria-label="t('common.loading')">
    <span class="dashboard-loading__label">{{ t('common.loading') }}</span>
    <div class="dashboard-loading__shell">
      <section v-if="view === 'home'" class="dashboard-loading__panel dashboard-loading__panel--home">
        <header class="dashboard-loading__home-header">
          <div class="skeleton-surface dashboard-loading__brand" />
        </header>

        <div class="dashboard-loading__profile">
          <div class="skeleton-surface dashboard-loading__avatar" />
          <div class="dashboard-loading__copy">
            <div class="skeleton-surface dashboard-loading__line dashboard-loading__line--kicker" />
            <div class="skeleton-surface dashboard-loading__line dashboard-loading__line--title" />
            <div class="skeleton-surface dashboard-loading__line dashboard-loading__line--accent" />
            <div class="skeleton-surface dashboard-loading__line dashboard-loading__line--body" />
            <div class="skeleton-surface dashboard-loading__line dashboard-loading__line--short" />
          </div>
          <div class="dashboard-loading__socials">
            <div
              v-for="link in HOME_LINKS"
              :key="link.id"
              class="skeleton-surface dashboard-loading__social"
              :style="{ '--home-skeleton-link-width': link.skeletonWidth }"
            />
          </div>
          <div class="skeleton-surface dashboard-loading__line dashboard-loading__line--status" />
        </div>
      </section>

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
                  <span v-for="row in project.id === 'docs' ? 4 : 3" :key="row" class="skeleton-surface" />
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

      <section v-else class="dashboard-loading__panel dashboard-loading__panel--pulse">
        <PulseSection :pulse="emptyPulse" :loading="true" />
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
  margin-inline: auto;
  grid-template-columns: 1fr;
}

.dashboard-loading__panel {
  min-height: max(34rem, 100svh);
  border: 0;
  border-radius: 0;
  padding: var(--page-block-start) var(--page-inline) var(--dock-safe-space);
  background: var(--surface-elevated);
  box-shadow: none;
}

.dashboard-loading__panel--home {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  background: #07172a;
}

:is(.dashboard-loading__panel--projects, .dashboard-loading__panel--focus, .dashboard-loading__panel--pulse) {
  background-color: var(--surface-elevated);
  background-image: var(--section-orbit-background);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.dashboard-loading__home-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-loading__brand { width: 8rem; height: 1.55rem; border-radius: var(--radius-control); opacity: 1; }
.dashboard-loading__profile { position: relative; z-index: 2; display: grid; width: 100%; max-width: var(--home-content-max); flex: 1; grid-template-areas: "avatar identity" ". links" ". status"; grid-template-columns: auto minmax(0, 1fr); align-content: safe center; column-gap: clamp(2.25rem, 4.5vw, 4.25rem); row-gap: 1.5rem; margin-inline: 0 auto; padding-block: clamp(1.5rem, 4vh, 3rem); }
.dashboard-loading__avatar { --skeleton-avatar-size: clamp(6.8rem, 12vw, 9.2rem); width: var(--skeleton-avatar-size); height: var(--skeleton-avatar-size); grid-area: avatar; align-self: center; border: 0; border-radius: 20%; padding: 0; opacity: 1; }
.dashboard-loading__copy { display: flex; width: min(100%, 28.625rem); min-width: 0; flex-direction: column; align-items: flex-start; }
.dashboard-loading__line { width: 100%; height: 0.76rem; border-radius: var(--radius-control); }
.dashboard-loading__panel--home .dashboard-loading__line { opacity: 1; }
.dashboard-loading__line--kicker { width: 45%; height: clamp(1.425rem, 1.94vw, 1.55rem); margin-bottom: 0.6rem; }
.dashboard-loading__line--title { width: 78%; height: clamp(2.95rem, 5.6vw, 4.3rem); }
.dashboard-loading__line--accent { width: 58%; height: clamp(1.55rem, 2.4vw, 1.92rem); margin-top: 0.85rem; }
.dashboard-loading__line--body { height: 1.565rem; margin-top: 0.7rem; }
.dashboard-loading__line--short { display: none; width: 70%; height: 1.565rem; }
.dashboard-loading__copy { grid-area: identity; align-self: center; }
.dashboard-loading__socials { display: flex; width: 100%; flex-wrap: wrap; grid-area: links; gap: 0.65rem; }
.dashboard-loading__social { width: var(--home-skeleton-link-width, 6rem); height: 2.75rem; border-radius: var(--radius-control); opacity: 1; }
.dashboard-loading__line--status { width: 14rem; height: 1.2rem; grid-area: status; }
.dashboard-loading__panel--projects {
  display: flex;
  min-height: max(34rem, 100svh);
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
  background: color-mix(in srgb, var(--surface-glass) 78%, transparent);
  box-shadow: var(--glass-surface-shadow);
}

.dashboard-loading__project-preview {
  display: grid;
  aspect-ratio: 16 / 10;
  place-items: stretch;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding: clamp(0.55rem, 1vw, 0.85rem);
  background: var(--glass-refraction-fill), var(--glass-card-fill);
}

.dashboard-loading__project-preview-frame {
  display: flex;
  min-height: 0;
  flex-direction: column;
  border-radius: var(--radius-control);
  padding: clamp(0.85rem, 1.5vw, 1.15rem);
  background: color-mix(in srgb, var(--background-secondary) 86%, transparent);
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
.dashboard-loading__project-preview-rows span {
  min-height: 0.8rem;
  flex: 1;
  border-radius: 0;
  border-bottom: 1px solid var(--glass-border-hairline);
  background: linear-gradient(90deg, var(--skeleton-fill) 0 62%, transparent 62%);
  opacity: 0.36;
}
.dashboard-loading__project-preview-rows span:last-child { border-bottom: 0; }

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
  background: color-mix(in srgb, var(--surface-glass) 78%, transparent);
  box-shadow: var(--glass-surface-shadow);
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

@media (max-width: 620px) {
  .dashboard-loading__profile { grid-template-areas: "avatar" "identity" "links" "status"; grid-template-columns: minmax(0, 1fr); row-gap: 1rem; padding-block: clamp(0.75rem, 2vh, 1.5rem); }
  .dashboard-loading__avatar { --skeleton-avatar-size: 6.3rem; }
  .dashboard-loading__copy { width: 100%; }
  .dashboard-loading__line--status { margin-top: 0.45rem; }
  .dashboard-loading__line--title { height: clamp(2.7rem, 15vw, 4.2rem); }
  .dashboard-loading__line--short { display: block; }

  .dashboard-loading__heading-line--description-2 { display: block; width: 92%; }
  .dashboard-loading__panel-heading--focus .dashboard-loading__heading-line--description-2 { display: none; }
  .dashboard-loading__panel-heading--projects .dashboard-loading__heading-line--description-3,
  .dashboard-loading__panel-heading--pulse .dashboard-loading__heading-line--description-3 { display: block; width: 74%; }
  .dashboard-loading__focus-journey-bar { min-height: 2.64rem; padding: 0.62rem 0.9rem; }
  .dashboard-loading__focus-journey-body { padding: 0.95rem 0.9rem 0.2rem; }
  .dashboard-loading__focus-footnote { min-height: 2.45rem; padding: 0.6rem 0.95rem; }
  .dashboard-loading__focus-interests-head { min-height: 2.64rem; padding: 0.62rem 0.9rem; }
  .dashboard-loading__focus-interests-hint { display: none; }
  .dashboard-loading__focus-interests-list { padding: 0.8rem 0.9rem 0.9rem; }
}

@media (max-width: 580px) {
  .dashboard-loading__project-preview { min-height: 10.5rem; }
  .dashboard-loading__project-description .dashboard-loading__project-line { height: calc(var(--text-xs) * 1.55); }
  .dashboard-loading__project-card--docs .dashboard-loading__project-line--description-2 { display: block; }
}

@media (max-width: 380px) {
  .dashboard-loading__track-row:last-child { min-height: 9.35rem; }
}

@media (max-width: 460px) {
  .dashboard-loading__focus-meta { display: none; }
}
</style>

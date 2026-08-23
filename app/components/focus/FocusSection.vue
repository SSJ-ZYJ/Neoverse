<script setup lang="ts">
import type { Component } from 'vue';
import { FOCUS_DOMAINS } from '#shared/constants';
import IconLucideBot from '~icons/lucide/bot';
import IconLucideCompass from '~icons/lucide/compass';
import IconLucideLayers from '~icons/lucide/layers';
import IconLucideTerminal from '~icons/lucide/terminal';
import IconLucideUserPlus from '~icons/lucide/user-plus';

const { t, tm, rt } = useI18n();
const translate = t as (key: string) => string;
const translateMessage = rt as (message: unknown) => string;

/* 领域图标（Lucide 统一风格，24×24 stroke）。 */
const DOMAIN_ICONS: Record<string, Component> = {
  foundations: IconLucideLayers,
  'open-source': IconLucideUserPlus,
  'agentic-development': IconLucideBot,
};

/* 成长阶段（Journey）：探索 → 学习 → 构建 → 应用。
   status 是真实数据，档位由它决定；状态徽标直接复用阶段名，保证语义统一。 */
const STAGE_ORDER = ['exploring', 'learning', 'building', 'applying'] as const;

const stageLabels = computed(() => {
  const raw: unknown = tm('focus.stages');
  return Array.isArray(raw) ? raw.map((item: unknown) => translateMessage(item)) : [];
});

const domains = computed(() =>
  FOCUS_DOMAINS.map((domain) => {
    const rawItems: unknown = tm(`focus.domains.${domain.id}.items`);
    return {
      ...domain,
      label: translate(`focus.domains.${domain.id}.label`),
      stageIndex: STAGE_ORDER.indexOf(domain.status),
      stageLabel: stageLabels.value[STAGE_ORDER.indexOf(domain.status)] ?? '',
      items: Array.isArray(rawItems) ? rawItems.map((item: unknown) => translateMessage(item)) : [],
    };
  }),
);

const topics = computed(() => {
  const raw: unknown = tm('focus.exploring.topics');
  return Array.isArray(raw) ? raw.map((item: unknown) => translateMessage(item)) : [];
});

/* 阶段轨道按节点位置对齐标签；不显示百分比，只呈现当前所处阶段。 */
const stageLeft = (index: number) => `${(index / (STAGE_ORDER.length - 1)) * 100}%`;
const stageAlign = (index: number) => {
  if (index === 0) return 'translateX(0)';
  if (index === STAGE_ORDER.length - 1) return 'translateX(-100%)';
  return 'translateX(-50%)';
};
</script>

<template>
  <section id="focus" class="dashboard-panel focus-panel" aria-labelledby="focus-title">
    <header class="panel-header">
      <h2 id="focus-title" class="panel-title">{{ t('focus.title') }}</h2>
      <p class="panel-description">{{ t('focus.description') }}</p>
    </header>

    <!-- 成长路径图：三个方向 × 探索/学习/构建/应用。档位来自真实 status，
         当前阶段节点高亮、其余弱化；刻意不做完成度填充，避免被读成百分比。 -->
    <div class="focus-journey glass-card">
      <div class="focus-journey__bar">
        <span class="focus-journey__command">
          <IconLucideTerminal class="focus-journey__command-icon" aria-hidden="true" />
          {{ t('focus.journeyCommand') }}
        </span>
        <span class="focus-journey__meta">{{ t('focus.fileMeta') }}</span>
      </div>

      <div class="focus-journey__body">
        <div class="stage-head" aria-hidden="true">
          <div class="stage-head__spacer" />
          <div class="stage-head__labels">
            <span
              v-for="(label, index) in stageLabels"
              :key="label"
              :style="{ left: stageLeft(index), transform: stageAlign(index) }"
            >{{ label }}</span>
          </div>
        </div>

        <article
          v-for="domain in domains"
          :key="domain.id"
          class="track-row"
          :class="`track-row--${domain.tone}`"
        >
          <div class="track-row__info">
            <div class="track-row__head">
              <span class="track-row__icon" aria-hidden="true">
                <component :is="DOMAIN_ICONS[domain.id]" aria-hidden="true" />
              </span>
              <span class="track-row__label">{{ domain.label }}</span>
              <span class="track-row__stage">{{ domain.stageLabel }}</span>
            </div>
            <ul class="track-row__items" aria-label="">
              <li v-for="item in domain.items" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div class="track" :aria-label="`${domain.label} · ${domain.stageLabel}`">
            <span
              v-for="(label, index) in stageLabels"
              :key="label"
              class="track__node"
              :class="{ 'is-current': index === domain.stageIndex }"
              :style="{ left: stageLeft(index) }"
            />
          </div>
        </article>
      </div>

      <p class="focus-journey__footnote"># {{ t('focus.mainComment') }}</p>
    </div>

    <!-- 轻量兴趣区：补足页面下半部分的信息密度，保持克制。 -->
    <aside class="focus-interests glass-card" :aria-label="String(t('focus.exploring.label'))">
      <div class="focus-interests__head">
        <IconLucideCompass class="focus-interests__icon" aria-hidden="true" />
        <span class="focus-interests__label">{{ t('focus.exploring.label') }}</span>
        <span class="focus-interests__hint"># {{ t('focus.exploring.comment') }}</span>
      </div>
      <ul class="focus-interests__list">
        <li v-for="topic in topics" :key="topic">{{ topic }}</li>
      </ul>
    </aside>
  </section>
</template>

<style scoped>
.focus-panel {
  --info-col: minmax(14rem, 21rem);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.focus-panel > .focus-interests {
  margin-top: 1rem;
}

.focus-panel > .panel-header,
.focus-panel > .focus-journey,
.focus-panel > .focus-interests {
  width: 100%;
  max-width: var(--focus-content-max);
  margin-inline: auto;
}

.focus-journey,
.focus-interests {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ── 卡片顶部终端栏 ─────────────────────────────────────────── */
.focus-journey__bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding: 0.72rem 1.15rem;
}

.focus-journey__command {
  display: inline-flex;
  overflow: hidden;
  align-items: center;
  gap: 0.45rem;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-md);
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-journey__command-icon {
  flex: 0 0 auto;
  width: 0.95rem;
  height: 0.95rem;
  fill: none;
  stroke: var(--text-muted);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.focus-journey__meta {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* ── 路径主体 ──────────────────────────────────────────────── */
.focus-journey__body {
  display: flex;
  flex-direction: column;
  padding: 0.95rem 1.35rem 0.3rem;
}

.stage-head {
  display: grid;
  grid-template-columns: var(--info-col) 1fr;
  gap: 1.4rem;
  padding: 0 0.4rem 0.65rem;
}

.stage-head__labels {
  position: relative;
  height: 1.1rem;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
}

.stage-head__labels span {
  position: absolute;
  top: 0;
  white-space: nowrap;
}

.track-row {
  display: grid;
  grid-template-columns: var(--info-col) 1fr;
  gap: 1.4rem;
  align-items: center;
  border-top: 1px solid var(--glass-border-hairline);
  border-radius: 0.45rem;
  padding: 0.85rem 0.4rem;
  transition: background-color var(--motion-fast) var(--motion-ease-standard);
}

.track-row:hover {
  background: color-mix(in srgb, var(--accent-primary) 4%, transparent);
}

.track-row--ice { --track-tone: var(--accent-primary); }
.track-row--mint { --track-tone: var(--accent-secondary); }
.track-row--violet { --track-tone: var(--accent-tertiary); }

.track-row__head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.track-row__icon {
  display: inline-flex;
  flex: 0 0 auto;
  width: 1.2rem;
  height: 1.2rem;
  color: var(--track-tone);
}

.track-row__icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.track-row__label {
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 阶段徽标：直接使用阶段名（探索/学习/构建/应用），语义与轨道一致。
   玻璃化：复用 glass-card 的折射渐变、内高光与毛玻璃滤镜。 */
.track-row__stage {
  flex: 0 0 auto;
  margin-left: auto;
  border: 1px solid color-mix(in srgb, var(--track-tone) 32%, var(--glass-border-hairline));
  border-radius: var(--radius-pill);
  padding: 0.12rem 0.55rem;
  background:
    var(--glass-refraction-fill),
    color-mix(in srgb, var(--track-tone) 12%, var(--glass-card-fill));
  -webkit-backdrop-filter: var(--aurora-filter-chrome);
  backdrop-filter: var(--aurora-filter-chrome);
  box-shadow: inset 0 1px 0 var(--glass-highlight);
  color: var(--track-tone);
  font-family: var(--font-sans);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

/* 技术栈小标签：轻量 mono 标签，保持克制。 */
.track-row__items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.5rem;
  margin: 0.45rem 0 0;
  padding: 0;
  list-style: none;
}

.track-row__items li {
  position: relative;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-2xs);
  letter-spacing: 0.03em;
}

.track-row__items li + li::before {
  content: '/';
  margin-right: 0.5rem;
  color: var(--border-strong);
}

/* ── Journey 轨道：无填充线，只有当前阶段高亮 ───────────────── */
.track {
  position: relative;
  height: 2.2rem;
}

.track::before {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: 1px;
  content: '';
  background: var(--border-subtle);
  transform: translateY(-50%);
}

.track__node {
  position: absolute;
  top: 50%;
  width: 0.6rem;
  height: 0.6rem;
  border: 2px solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface-elevated);
  opacity: 0.55;
  transform: translate(-50%, -50%);
}

.track__node.is-current {
  z-index: 1;
  width: 0.9rem;
  height: 0.9rem;
  border-color: var(--track-tone);
  background: var(--track-tone);
  box-shadow:
    0 0 0 0.22rem color-mix(in srgb, var(--track-tone) 24%, transparent),
    0 0 0.75rem color-mix(in srgb, var(--track-tone) 68%, transparent);
  opacity: 1;
}

.track__node.is-current::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  content: '';
  background: color-mix(in srgb, var(--track-tone) 92%, transparent);
  box-shadow: 0 0 0.85rem color-mix(in srgb, var(--track-tone) 62%, transparent);
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  animation: focus-track-node-halo 1.7s cubic-bezier(0.28, 0, 0.18, 1) infinite;
  pointer-events: none;
  will-change: transform, opacity;
}

@keyframes focus-track-node-halo {
  0% { opacity: 0.95; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.48; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(3.15); }
}

/* ── 底部注释 ──────────────────────────────────────────────── */
.focus-journey__footnote {
  margin: 0;
  border-top: 1px solid var(--glass-border-hairline);
  padding: 0.65rem 1.35rem;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  opacity: 0.85;
}

/* ── Currently Exploring：单行头部 + 简洁主题列表 ────────────── */
.focus-interests__head {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding: 0.72rem 1.15rem;
}

.focus-interests__icon {
  align-self: center;
  flex: 0 0 auto;
  width: 0.95rem;
  height: 0.95rem;
  color: var(--accent-primary);
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.focus-interests__label {
  color: var(--text-primary);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  letter-spacing: -0.005em;
}

.focus-interests__hint {
  overflow: hidden;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-interests__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.65rem;
  margin: 0;
  padding: 0.85rem 1.15rem 0.95rem;
  list-style: none;
}

.focus-interests__list li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: 0.03em;
}

.focus-interests__list li::before {
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 50%;
  background: var(--accent-primary);
  content: '';
  opacity: 0.7;
}

@media (max-width: 900px) {
  .focus-panel { --info-col: 1fr; }
  .stage-head { grid-template-columns: 1fr; gap: 0.3rem; }
  .stage-head__spacer { display: none; }
  .stage-head__labels { margin-left: 0.5rem; }
  .track-row { grid-template-columns: 1fr; gap: 0.9rem; }
  .track { margin-left: 0.5rem; }
}

@media (max-width: 760px) {
  .focus-journey__bar { padding: 0.62rem 0.9rem; }
  .focus-journey__body { padding: 0.95rem 0.9rem 0.2rem; }
  .focus-journey__footnote { padding: 0.6rem 0.95rem; }
  .track-row { padding-block: 0.85rem; }
  .track-row__label { font-size: var(--text-base); }
  .track-row__stage { font-size: var(--text-2xs); }
  .focus-interests__head { padding: 0.62rem 0.9rem; }
  .focus-interests__hint { display: none; }
  .focus-interests__list { padding: 0.8rem 0.9rem 0.9rem; }
}

@media (max-width: 460px) {
  .focus-journey__meta { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .track__node.is-current::after {
    opacity: 0;
    animation: none;
  }
}
</style>

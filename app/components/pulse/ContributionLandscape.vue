<script setup lang="ts">
import type { GithubPulse } from '#shared/types/github';

const props = defineProps<{ contributions: GithubPulse['contributions']; loading: boolean }>();
const { t, locale } = useI18n();
type ContributionDay = GithubPulse['contributions']['days'][number];
type ChartPointerAxis = 'pending' | 'horizontal' | 'vertical';
type ChartPointerSession = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTimestamp: number;
  startScrollLeft: number;
  velocity: number;
  axis: ChartPointerAxis;
  dragged: boolean;
};

const CHART_DRAG_THRESHOLD = 6;
const CHART_MIN_INERTIA_VELOCITY = 0.02;
const CHART_EDGE_OFFSET_EPSILON = 0.2;
const CHART_SPRING_VELOCITY_EPSILON = 0.02;
const CHART_MOTION_DEFAULTS = {
  edgeResistance: 0.28,
  edgeMax: 52,
  inertiaFriction: 0.92,
  springStiffness: 0.00042,
  springDamping: 0.6,
};

const cardElement = ref<HTMLElement | null>(null);
const chartScroller = ref<HTMLElement | null>(null);
const activeDay = ref<ContributionDay | null>(null);
const tooltipPlacement = ref<'center' | 'start' | 'end'>('center');
const tooltipStyle = ref({ left: '0px', top: '0px' });
const chartEdgeOffset = ref(0);
const chartScrollerStyle = computed(() => ({
  '--contribution-edge-offset': `${String(chartEdgeOffset.value)}px`,
}));
let chartPointerSession: ChartPointerSession | null = null;
let chartMotionFrame: number | undefined;
let latestAlignmentFrame: number | undefined;
let suppressChartClickUntil = 0;
let chartInteractionStarted = false;
let chartContentObserver: MutationObserver | undefined;
let chartLayoutObserver: ResizeObserver | undefined;

const firstDayOffset = computed(() => {
  const firstDay = props.contributions.days[0]?.date;
  return firstDay ? new Date(`${firstDay}T00:00:00Z`).getUTCDay() : 0;
});

const cells = computed(() => {
  const days = props.contributions.days;
  if (!days.length) return [];
  return [...Array.from({ length: firstDayOffset.value }, () => null), ...days];
});

const columnCount = computed(() => Math.max(1, Math.ceil(cells.value.length / 7)));

const months = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { month: 'short', timeZone: 'UTC' });
  const found = new Map<string, { key: string; label: string; column: number }>();
  props.contributions.days.forEach((day, index) => {
    const month = day.date.slice(0, 7);
    if (!found.has(month)) {
      found.set(month, {
        key: month,
        label: formatter.format(new Date(`${day.date}T00:00:00Z`)),
        column: Math.floor((index + firstDayOffset.value) / 7) + 1,
      });
    }
  });
  return [...found.values()];
});

const scopeLabel = computed(() => t(`pulse.landscape.scope.${props.contributions.scope}`));
const dateFormatter = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeZone: 'UTC' }));
const formatDayDate = (date: string) => dateFormatter.value.format(new Date(`${date}T00:00:00Z`));
const activeDayLabel = computed(() =>
  activeDay.value
    ? t('pulse.landscape.dayLabel', { count: activeDay.value.count, date: formatDayDate(activeDay.value.date) })
    : '',
);

function showDayTooltip(day: ContributionDay, event: Event) {
  activeDay.value = day;
  const target = event.currentTarget;
  const card = cardElement.value;
  if (!(target instanceof HTMLElement) || !card) return;

  const targetRect = target.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const center = targetRect.left - cardRect.left + targetRect.width / 2;
  const edgeThreshold = Math.min(8 * 16, cardRect.width / 4);
  tooltipPlacement.value =
    center < edgeThreshold ? 'start' : cardRect.width - center < edgeThreshold ? 'end' : 'center';
  tooltipStyle.value = {
    left: `${String(center)}px`,
    top: `${String(targetRect.top - cardRect.top)}px`,
  };
}

function clearDayTooltip() {
  if (activeDay.value) activeDay.value = null;
}

function getChartMaxScroll(scroller: HTMLElement) {
  return Math.max(0, scroller.scrollWidth - scroller.clientWidth);
}

function readChartMotionToken(name: string, fallback: number) {
  const scroller = chartScroller.value;
  if (!scroller) return fallback;
  const value = Number.parseFloat(getComputedStyle(scroller).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function getChartMotionConfig() {
  return {
    edgeResistance: readChartMotionToken('--pulse-heatmap-edge-resistance', CHART_MOTION_DEFAULTS.edgeResistance),
    edgeMax: readChartMotionToken('--pulse-heatmap-edge-max-px', CHART_MOTION_DEFAULTS.edgeMax),
    inertiaFriction: readChartMotionToken('--pulse-heatmap-inertia-friction', CHART_MOTION_DEFAULTS.inertiaFriction),
    springStiffness: readChartMotionToken('--pulse-heatmap-spring-stiffness', CHART_MOTION_DEFAULTS.springStiffness),
    springDamping: readChartMotionToken('--pulse-heatmap-spring-damping', CHART_MOTION_DEFAULTS.springDamping),
  };
}

function setChartEdgeOffset(offset: number, maxOffset = getChartMotionConfig().edgeMax) {
  chartEdgeOffset.value = Math.min(maxOffset, Math.max(-maxOffset, offset));
}

function cancelChartMotion() {
  if (chartMotionFrame === undefined) return;
  cancelAnimationFrame(chartMotionFrame);
  chartMotionFrame = undefined;
}

function cancelLatestAlignment() {
  if (latestAlignmentFrame === undefined) return;
  cancelAnimationFrame(latestAlignmentFrame);
  latestAlignmentFrame = undefined;
}

function startChartEdgeSpring(initialOffset: number, initialVelocity = 0) {
  const scroller = chartScroller.value;
  if (!scroller) return;

  const motion = getChartMotionConfig();
  cancelChartMotion();
  let position = initialOffset;
  let velocity = initialVelocity;
  let lastTimestamp = performance.now();

  const step = (timestamp: number) => {
    const elapsed = Math.min(32, Math.max(1, timestamp - lastTimestamp));
    lastTimestamp = timestamp;
    velocity += -position * motion.springStiffness * elapsed;
    velocity *= motion.springDamping ** (elapsed / 16);
    position += velocity * elapsed;
    setChartEdgeOffset(position, motion.edgeMax);

    if (Math.abs(position) <= CHART_EDGE_OFFSET_EPSILON && Math.abs(velocity) <= CHART_SPRING_VELOCITY_EPSILON) {
      setChartEdgeOffset(0, motion.edgeMax);
      chartMotionFrame = undefined;
      return;
    }
    chartMotionFrame = requestAnimationFrame(step);
  };

  setChartEdgeOffset(position, motion.edgeMax);
  chartMotionFrame = requestAnimationFrame(step);
}

function startChartInertia(initialVelocity: number) {
  const scroller = chartScroller.value;
  if (!scroller || Math.abs(initialVelocity) < CHART_MIN_INERTIA_VELOCITY) {
    setChartEdgeOffset(0);
    return;
  }

  const motion = getChartMotionConfig();
  cancelChartMotion();
  let velocity = initialVelocity;
  let lastTimestamp = performance.now();

  const step = (timestamp: number) => {
    const elapsed = Math.min(32, Math.max(1, timestamp - lastTimestamp));
    lastTimestamp = timestamp;
    velocity *= motion.inertiaFriction ** (elapsed / 16);
    const maxScroll = getChartMaxScroll(scroller);
    const nextScrollLeft = scroller.scrollLeft + velocity * elapsed;

    if (nextScrollLeft < 0) {
      scroller.scrollLeft = 0;
      startChartEdgeSpring(
        Math.min(motion.edgeMax, -nextScrollLeft * motion.edgeResistance),
        velocity * motion.edgeResistance,
      );
      return;
    }
    if (nextScrollLeft > maxScroll) {
      scroller.scrollLeft = maxScroll;
      startChartEdgeSpring(
        -Math.min(motion.edgeMax, (nextScrollLeft - maxScroll) * motion.edgeResistance),
        velocity * motion.edgeResistance,
      );
      return;
    }

    scroller.scrollLeft = nextScrollLeft;
    if (Math.abs(velocity) < CHART_MIN_INERTIA_VELOCITY) {
      chartMotionFrame = undefined;
      return;
    }
    chartMotionFrame = requestAnimationFrame(step);
  };

  chartMotionFrame = requestAnimationFrame(step);
}

function setChartDragPosition(rawScrollLeft: number) {
  const scroller = chartScroller.value;
  if (!scroller) return;

  const maxScroll = getChartMaxScroll(scroller);
  const motion = getChartMotionConfig();
  if (rawScrollLeft < 0) {
    scroller.scrollLeft = 0;
    setChartEdgeOffset(Math.min(motion.edgeMax, -rawScrollLeft * motion.edgeResistance), motion.edgeMax);
    return;
  }
  if (rawScrollLeft > maxScroll) {
    scroller.scrollLeft = maxScroll;
    setChartEdgeOffset(-Math.min(motion.edgeMax, (rawScrollLeft - maxScroll) * motion.edgeResistance), motion.edgeMax);
    return;
  }

  scroller.scrollLeft = rawScrollLeft;
  setChartEdgeOffset(0, motion.edgeMax);
}

function releaseChartPointer(event: PointerEvent) {
  const scroller = chartScroller.value;
  if (scroller?.hasPointerCapture(event.pointerId)) scroller.releasePointerCapture(event.pointerId);
}

function onChartPointerDown(event: PointerEvent) {
  const scroller = chartScroller.value;
  if (!scroller || getChartMaxScroll(scroller) <= 0 || (event.pointerType === 'mouse' && event.button !== 0)) return;

  chartInteractionStarted = true;
  cancelLatestAlignment();
  cancelChartMotion();
  chartPointerSession = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastTimestamp: performance.now(),
    startScrollLeft: scroller.scrollLeft,
    velocity: 0,
    axis: 'pending',
    dragged: false,
  };
  scroller.setPointerCapture(event.pointerId);
}

function onChartPointerMove(event: PointerEvent) {
  const scroller = chartScroller.value;
  const session = chartPointerSession;
  if (!scroller || !session || event.pointerId !== session.pointerId) return;

  const deltaX = event.clientX - session.startX;
  const deltaY = event.clientY - session.startY;
  if (session.axis === 'pending') {
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < CHART_DRAG_THRESHOLD) return;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
      session.axis = 'vertical';
      releaseChartPointer(event);
      chartPointerSession = null;
      return;
    }
    session.axis = 'horizontal';
  }
  if (session.axis !== 'horizontal') return;

  event.preventDefault();
  const timestamp = performance.now();
  const elapsed = Math.min(64, Math.max(1, timestamp - session.lastTimestamp));
  const scrollDelta = -(event.clientX - session.lastX);
  const instantVelocity = scrollDelta / elapsed;
  session.velocity = session.velocity * 0.7 + instantVelocity * 0.3;
  session.lastX = event.clientX;
  session.lastTimestamp = timestamp;
  session.dragged = true;
  setChartDragPosition(session.startScrollLeft - deltaX);
}

function finishChartPointer(event: PointerEvent, cancelled = false) {
  const session = chartPointerSession;
  if (!session || event.pointerId !== session.pointerId) return;

  releaseChartPointer(event);
  chartPointerSession = null;
  if (session.axis !== 'horizontal') {
    setChartEdgeOffset(0);
    return;
  }

  if (session.dragged) suppressChartClickUntil = performance.now() + 180;
  const edgeOffset = chartEdgeOffset.value;
  const motion = getChartMotionConfig();
  if (Math.abs(edgeOffset) > CHART_EDGE_OFFSET_EPSILON) {
    startChartEdgeSpring(edgeOffset, cancelled ? 0 : session.velocity * motion.edgeResistance);
    return;
  }
  if (cancelled) {
    setChartEdgeOffset(0);
    return;
  }
  startChartInertia(session.velocity);
}

function onChartPointerUp(event: PointerEvent) {
  finishChartPointer(event);
}

function onChartPointerCancel(event: PointerEvent) {
  finishChartPointer(event, true);
}

function onChartClick(event: MouseEvent) {
  if (performance.now() >= suppressChartClickUntil) return;
  suppressChartClickUntil = 0;
  event.preventDefault();
  event.stopPropagation();
}

function observeChartLayout() {
  const scroller = chartScroller.value;
  if (!scroller) return;

  chartLayoutObserver?.disconnect();
  chartLayoutObserver = new ResizeObserver(() => {
    if (!props.loading && !chartInteractionStarted) void scrollToLatestContributions();
  });
  chartLayoutObserver.observe(scroller);
  for (const child of scroller.children) chartLayoutObserver.observe(child);
}

async function scrollToLatestContributions() {
  await nextTick();
  cancelLatestAlignment();
  latestAlignmentFrame = requestAnimationFrame(() => {
    latestAlignmentFrame = requestAnimationFrame(() => {
      latestAlignmentFrame = undefined;
      const scroller = chartScroller.value;
      if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
      scroller.scrollLeft = scroller.scrollWidth;
    });
  });
}

onMounted(() => {
  void scrollToLatestContributions();
  const scroller = chartScroller.value;
  if (!scroller) return;
  observeChartLayout();
  chartContentObserver = new MutationObserver(() => {
    observeChartLayout();
    if (!props.loading && !chartInteractionStarted) void scrollToLatestContributions();
  });
  chartContentObserver.observe(scroller, { childList: true, subtree: true });
});
watch(
  [
    () => props.loading,
    () => props.contributions.days.length,
    () => props.contributions.days.at(-1)?.date,
    () => columnCount.value,
  ],
  ([loading]) => {
    if (loading) chartInteractionStarted = false;
    void scrollToLatestContributions();
  },
  { flush: 'post' },
);
onUpdated(() => {
  if (!props.loading && !chartInteractionStarted) void scrollToLatestContributions();
});

let scrollRaf = 0;
function onChartScroll() {
  if (!activeDay.value) return;
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    activeDay.value = null;
  });
}

onBeforeUnmount(() => {
  cancelChartMotion();
  cancelLatestAlignment();
  chartContentObserver?.disconnect();
  chartLayoutObserver?.disconnect();
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
});

function hideDayTooltip(day: ContributionDay) {
  if (document.activeElement instanceof HTMLElement && document.activeElement.dataset.date === day.date) return;
  if (activeDay.value?.date === day.date) clearDayTooltip();
}
</script>

<template>
  <div ref="cardElement" class="contribution-card glass-card">
    <div class="contribution-card__header">
      <div class="contribution-card__header-main">
        <h3>{{ t('pulse.landscape.title') }}</h3>
        <span>{{ scopeLabel }}</span>
      </div>
      <span class="contribution-card__legend contribution-card__legend--header" aria-hidden="true">
        {{ t('pulse.landscape.less') }}
        <i v-for="level in 5" :key="`h-${level}`" :class="`level-${level - 1}`" />
        {{ t('pulse.landscape.more') }}
      </span>
    </div>

    <div class="contribution-card__body">
      <div
        ref="chartScroller"
        class="contribution-card__chart"
        :style="chartScrollerStyle"
        @click="onChartClick"
        @pointerdown="onChartPointerDown"
        @pointermove="onChartPointerMove"
        @pointerup="onChartPointerUp"
        @pointercancel="onChartPointerCancel"
        @scroll.passive="onChartScroll"
      >
        <template v-if="loading">
          <div class="contribution-card__loading-chart" aria-hidden="true">
            <div class="contribution-card__skeleton-grid">
              <span v-for="cell in 371" :key="cell" class="contribution-card__skeleton-cell" />
            </div>
            <span class="contribution-card__legend contribution-card__legend--chart">
              {{ t('pulse.landscape.less') }}
              <i v-for="level in 5" :key="level" :class="`level-${level - 1}`" />
              {{ t('pulse.landscape.more') }}
            </span>
          </div>
        </template>
        <template v-else-if="cells.length">
          <div
            class="contribution-card__months"
            :style="{ '--contribution-columns': String(columnCount) }"
            aria-hidden="true"
          >
            <span
              v-for="month in months"
              :key="month.key"
              :style="{ '--month-column': String(month.column) }"
            >{{ month.label }}</span>
          </div>
          <div
            class="contribution-grid"
            :style="{ '--contribution-columns': String(columnCount) }"
            :aria-label="t('pulse.landscape.gridAria')"
          >
            <template v-for="(day, index) in cells" :key="day?.date ?? `blank-${index}`">
              <button
                v-if="day"
                type="button"
                class="contribution-day"
                :class="`level-${day.level}`"
                :data-date="day.date"
                :aria-label="t('pulse.landscape.dayLabel', { count: day.count, date: formatDayDate(day.date) })"
                @mouseenter="showDayTooltip(day, $event)"
                @mouseleave="hideDayTooltip(day)"
                @focus="showDayTooltip(day, $event)"
                @blur="hideDayTooltip(day)"
              />
              <span v-else class="contribution-day is-blank" aria-hidden="true" />
            </template>
          </div>
          <span class="contribution-card__legend contribution-card__legend--chart" aria-hidden="true">
            {{ t('pulse.landscape.less') }}
            <i v-for="level in 5" :key="level" :class="`level-${level - 1}`" />
            {{ t('pulse.landscape.more') }}
          </span>
        </template>
        <p v-else class="contribution-card__empty">{{ t('pulse.landscape.empty') }}</p>
      </div>

      <dl class="contribution-stats">
        <div>
          <dt>{{ t('pulse.stats.contributions') }}</dt>
          <dd v-if="loading"><BaseSkeleton variant="title" width="4rem" /></dd>
          <dd v-else>{{ contributions.scope === 'unavailable' ? '—' : contributions.total.toLocaleString(locale) }}</dd>
        </div>
        <div>
          <dt>{{ t('pulse.stats.streak') }}</dt>
          <dd v-if="loading"><BaseSkeleton variant="title" width="3rem" /></dd>
          <dd v-else>{{ contributions.scope === 'unavailable' ? '—' : t('pulse.stats.days', { count: contributions.longestStreak }) }}</dd>
        </div>
        <div>
          <dt>{{ t('pulse.stats.range') }}</dt>
          <dd v-if="loading"><BaseSkeleton variant="text" width="5rem" /></dd>
          <dd v-else>{{ scopeLabel }}</dd>
        </div>
      </dl>
    </div>

    <div
      v-if="activeDay"
      class="contribution-tooltip"
      :class="`contribution-tooltip--${tooltipPlacement}`"
      :style="tooltipStyle"
      aria-hidden="true"
    >
      {{ activeDayLabel }}
    </div>
  </div>
</template>

<style scoped>
/* 一屏压缩：日历格缩小、统计改横排三列、去掉大 min-height。宽容器时统计竖排到热力图右侧。 */
.contribution-card { position: relative; container: contribution-card / inline-size; contain: paint; transform: translateZ(0); padding: clamp(0.85rem, 1.6vw, 1.35rem); }
.contribution-card__header { display: flex; align-items: flex-end; justify-content: space-between; gap: 0.6rem 1.2rem; flex-wrap: wrap; }
.contribution-card__header-main { min-width: 0; }
.contribution-card__header h3 { margin: 0; color: var(--text-primary); font-size: var(--text-card-title); font-weight: var(--weight-bold); letter-spacing: -0.04em; }
.contribution-card__header-main > span { display: block; margin-top: 0.22rem; color: var(--text-muted); font-size: var(--text-sm); }
.contribution-card__legend { display: flex; align-items: center; gap: 0.28rem; color: var(--text-muted); font-size: var(--text-xs); white-space: nowrap; }
.contribution-card__legend--chart { justify-content: flex-end; margin-top: 0.5rem; }
.contribution-card__legend--header { display: none; align-self: center; margin-top: 0; }
/* 圆角封顶 25%：格子缩到 ~11px 以下时 --radius-xs(0.35rem) 超过半边长，四角弧线重叠退化成纯圆。 */
.contribution-card__legend i { width: clamp(0.62rem, 0.8vw, 0.8rem); height: clamp(0.62rem, 0.8vw, 0.8rem); border-radius: min(var(--radius-xs), 25%); }
.level-0 { background: color-mix(in srgb, var(--text-muted) 18%, var(--background-secondary)); }
.level-1 { background: color-mix(in srgb, var(--accent-secondary) 24%, var(--background-secondary)); }
.level-2 { background: color-mix(in srgb, var(--accent-secondary) 46%, var(--background-secondary)); }
.level-3 { background: color-mix(in srgb, var(--accent-secondary) 66%, var(--accent-primary)); }
.level-4 { background: color-mix(in srgb, var(--accent-primary) 78%, var(--accent-secondary)); }
.contribution-card__body { display: grid; grid-template-columns: minmax(0, 1fr); gap: clamp(0.7rem, 1.4vw, 1.1rem); margin-top: clamp(0.7rem, 1.4vw, 1.05rem); }
.contribution-card__chart { display: grid; min-width: 0; align-content: center; overflow-x: auto; overflow-y: hidden; padding: 0.2rem 0 0.4rem; scrollbar-color: color-mix(in srgb, var(--text-secondary) 55%, transparent) transparent; scroll-behavior: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; touch-action: pan-y; user-select: none; contain: paint; }
.contribution-card__chart > * { transform: translate3d(var(--contribution-edge-offset, 0px), 0, 0); }
.contribution-card__chart::-webkit-scrollbar { height: 6px; -webkit-appearance: none; appearance: none; }
.contribution-card__chart::-webkit-scrollbar-track { background: transparent; }
.contribution-card__chart::-webkit-scrollbar-thumb { border-radius: 999px; background: color-mix(in srgb, var(--text-secondary) 55%, transparent); }
.contribution-card__chart::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--text-primary) 72%, transparent); }
@supports (scrollbar-width: thin) {
  .contribution-card__chart { scrollbar-width: thin; }
}
@supports selector(::-webkit-scrollbar) {
  .contribution-card__chart { scrollbar-width: auto; scrollbar-color: auto; }
}
/* 流式网格：格子随容器拉伸填满左列（宽屏格子更大），aspect-ratio 保持正方；
   min-cell 兜底，过窄时交给 overflow-x 滚动；0.68rem 保证月份标签（较宽的 10月/11月）不重叠。 */
.contribution-card__months, .contribution-grid { --contribution-gap: clamp(0.16rem, 0.22vw, 0.22rem); --contribution-min-cell: 0.68rem; }
.contribution-card__months { display: grid; grid-template-columns: repeat(var(--contribution-columns), minmax(var(--contribution-min-cell), 1fr)); column-gap: var(--contribution-gap); margin: 0 0 0.45rem; color: var(--text-muted); font-size: var(--text-xs); }
.contribution-card__months span { grid-column: var(--month-column); white-space: nowrap; }
.contribution-grid { display: grid; grid-auto-flow: column; grid-template-columns: repeat(var(--contribution-columns), minmax(var(--contribution-min-cell), 1fr)); grid-template-rows: repeat(7, auto); gap: var(--contribution-gap); }
@container contribution-card (max-width: 40rem) {
  .contribution-card__legend--header { display: flex; }
  .contribution-card__legend--chart { display: none; }
}
@container contribution-card (max-width: 36rem) {
  .contribution-card__months span:nth-child(even) { display: none; }
}
.contribution-card__loading-chart { --contribution-columns: 53; --contribution-gap: clamp(0.22rem, 0.3vw, 0.32rem); --contribution-min-cell: 0.68rem; --contribution-grid-width: calc(var(--contribution-columns) * var(--contribution-min-cell) + (var(--contribution-columns) - 1) * var(--contribution-gap)); display: grid; min-width: 0; align-content: center; gap: 0; }
/* 容器保持透明，只显示互相分离的静态格子；避免背景填满间隙后黏成灰色整块。 */
.contribution-card__skeleton-grid { display: grid; width: 100%; min-width: var(--contribution-grid-width); grid-auto-flow: column; grid-template-columns: repeat(var(--contribution-columns), minmax(var(--contribution-min-cell), 1fr)); grid-template-rows: repeat(7, auto); gap: var(--contribution-gap); opacity: 0.56; }
.contribution-card__skeleton-cell { min-width: 0; aspect-ratio: 1; border-radius: min(var(--radius-xs), 25%); background: var(--skeleton-fill); box-shadow: var(--skeleton-edge); }
.contribution-card__loading-chart > .contribution-card__legend--chart { margin-top: 0.5rem; }
.contribution-day { display: block; aspect-ratio: 1; border: 0; border-radius: min(var(--radius-xs), 25%); padding: 0; cursor: pointer; transition: filter var(--motion-fast) var(--motion-ease-standard), box-shadow var(--motion-fast) var(--motion-ease-standard), transform var(--motion-fast) var(--motion-ease-standard); }
.contribution-day:hover { filter: brightness(1.12); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 48%, transparent); transform: translateY(-1px); }
.contribution-day:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.contribution-day.is-blank { visibility: hidden; cursor: default; }
.contribution-card__empty { display: grid; min-height: 8rem; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-md); text-align: center; }
/* 统计横排三列：取代原右侧纵向 16.5rem 的高柱。 */
.contribution-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; margin: 0; }
.contribution-stats div { display: grid; align-content: center; border-top: 1px solid var(--glass-border-hairline); border-right: 1px solid var(--glass-border-hairline); padding: 0.55rem 0.9rem; }
.contribution-stats div:first-child { border-top: 0; }
.contribution-stats div:last-child { border-right: 0; }
.contribution-stats dt { color: var(--text-muted); font-size: var(--text-sm); font-weight: var(--weight-semibold); }
.contribution-stats dd { margin: 0.18rem 0 0; color: var(--text-primary); font-size: var(--text-stat); font-weight: var(--weight-display); letter-spacing: -0.05em; line-height: 1; }
.contribution-stats dd :deep(.base-skeleton) { height: var(--text-stat); }
.contribution-stats dd :deep(.base-skeleton--text) { height: calc(var(--text-sm) * 1.55); }
.contribution-stats div:last-child dd { color: var(--accent-primary); font-size: var(--text-stat-sm); letter-spacing: -0.03em; }
.contribution-tooltip { position: absolute; z-index: 5; max-width: min(16rem, calc(100% - 1rem)); border: 1px solid color-mix(in srgb, var(--accent-primary) 34%, var(--border-subtle)); border-radius: var(--radius-control); padding: 0.42rem 0.62rem; color: var(--text-primary); font-size: var(--text-xs); font-weight: var(--weight-semibold); line-height: 1.35; white-space: nowrap; background: color-mix(in srgb, var(--surface-elevated) 92%, var(--accent-primary)); box-shadow: var(--shadow-float); pointer-events: none; transform: translate(-50%, calc(-100% - 0.65rem)); }
.contribution-tooltip::after { position: absolute; bottom: -0.28rem; left: 50%; width: 0.5rem; height: 0.5rem; border-right: 1px solid color-mix(in srgb, var(--accent-primary) 34%, var(--border-subtle)); border-bottom: 1px solid color-mix(in srgb, var(--accent-primary) 34%, var(--border-subtle)); background: color-mix(in srgb, var(--surface-elevated) 92%, var(--accent-primary)); content: ""; transform: translateX(-50%) rotate(45deg); }
.contribution-tooltip--start { transform: translate(0, calc(-100% - 0.65rem)); }
.contribution-tooltip--start::after { left: 1rem; }
.contribution-tooltip--end { transform: translate(-100%, calc(-100% - 0.65rem)); }
.contribution-tooltip--end::after { left: calc(100% - 1rem); }
@media (max-width: 600px) {
  .contribution-tooltip--start { transform: translate(-1rem, calc(-100% - 0.65rem)); }
  .contribution-tooltip--end { transform: translate(calc(-100% + 1rem), calc(-100% - 0.65rem)); }
}
/* 容器够宽时：统计竖排到热力图右侧，避免下方大片留白。 */
@container contribution-card (min-width: 56rem) {
  .contribution-card__body { grid-template-columns: minmax(0, 1fr) auto; align-items: stretch; }
  .contribution-stats { display: flex; min-width: 10.5rem; flex-direction: column; justify-content: center; border-left: 1px solid var(--glass-border-hairline); }
  .contribution-stats div { border-top: 0; border-right: 0; padding: 0.6rem 0 0.6rem 1.1rem; }
  .contribution-stats div + div { border-top: 1px solid var(--glass-border-hairline); }
}
@media (max-width: 600px) {
  .contribution-stats div { padding: 0.5rem 0.5rem; }
  .contribution-stats dd { font-size: var(--text-card-title-narrow); }
  .contribution-stats dd :deep(.base-skeleton) { height: var(--text-card-title-narrow); }
  .contribution-stats dd :deep(.base-skeleton--text) { height: calc(var(--text-sm) * 1.55); }
}
</style>

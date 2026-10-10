<script setup lang="ts">
import { cssTimeToMilliseconds } from '~/utils/homeIntroTiming';

const props = defineProps<{ playing: boolean }>();
const emit = defineEmits<{ reveal: []; complete: [] }>();
const { t } = useI18n();
useHead({
  link: [
    {
      rel: 'preload',
      href: '/fonts/oxanium-latin-600-normal.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous',
    },
  ],
});
const overlay = ref<HTMLElement | null>(null);
const logo = ref<HTMLElement | null>(null);
const revealing = ref(false);
const captionVisible = ref(false);
const docking = ref(false);
const animations: Animation[] = [];
let started = false;
let preparing = false;
let finished = false;
let disposed = false;
let motionPreference: MediaQueryList | undefined;
let pendingDock: (() => void) | undefined;

function cleanup() {
  pendingDock = undefined;
  for (const animation of animations) animation.cancel();
  document.removeEventListener('visibilitychange', onVisibilityChange);
  motionPreference?.removeEventListener('change', onMotionChange);
}

function complete() {
  if (finished || disposed) return;
  finished = true;
  cleanup();
  emit('reveal');
  emit('complete');
}

function onVisibilityChange() {
  if (!started) {
    if (!document.hidden) void play();
    return;
  }
  for (const animation of animations) {
    if (document.hidden && animation.playState === 'running') animation.pause();
    else if (!document.hidden && animation.playState === 'paused') animation.play();
  }
  if (!document.hidden && pendingDock) {
    const dock = pendingDock;
    pendingDock = undefined;
    dock();
  }
}

function onMotionChange() {
  if (motionPreference?.matches) complete();
}

function schedule(callback: () => void, delay: number) {
  // Use the animation timeline for cues too: wall-clock timers can run ahead
  // of the first painted frame, or expire while a hidden tab is paused.
  const cue = overlay.value?.animate([], { duration: delay });
  if (!cue) return;
  animations.push(cue);
  void cue.finished.then(
    () => {
      if (!finished && !disposed) callback();
    },
    () => {},
  );
}

async function play() {
  if (started || preparing || finished || disposed) return;
  preparing = true;
  await nextTick();
  if (finished || disposed) return;
  const mark = logo.value;
  const root = overlay.value;
  motionPreference ??= window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mark || !root || motionPreference.matches) {
    complete();
    return;
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  motionPreference.addEventListener('change', onMotionChange);

  if (document.hidden) {
    preparing = false;
    return;
  }
  // Paint the initial empty contours before starting, including cached loads.
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  preparing = false;
  if (finished || disposed || document.hidden) return;
  started = true;

  const styles = getComputedStyle(root);
  const duration = (name: string) => cssTimeToMilliseconds(styles.getPropertyValue(name));
  const draw = duration('--motion-intro-draw');
  const stagger = duration('--motion-intro-stagger');
  const fillDelay = Math.max(duration('--motion-intro-fill-delay'), draw + stagger);
  const fill = duration('--motion-intro-fill');
  const dockDelay = Math.max(duration('--motion-intro-dock-delay'), fillDelay + 2 * fill);
  const dock = duration('--motion-intro-dock');
  const revealLead = duration('--motion-intro-reveal-lead');
  const captionDelay = duration('--motion-intro-caption-delay');
  const easing = styles.getPropertyValue('--motion-ease-emphasized').trim();
  const timings = [draw, stagger, fillDelay, fill, dockDelay, dock, revealLead, captionDelay];
  if (timings.some((value) => !Number.isFinite(value) || value < 0)) {
    complete();
    return;
  }

  try {
    const paths = mark.querySelectorAll<SVGPathElement>('path');
    if (!paths.length) {
      complete();
      return;
    }
    for (const path of paths) {
      const progress = Math.min(1, Math.max(0, (path.getBBox().x - 60) / 2050));
      animations.push(
        path.animate([{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], {
          duration: draw,
          delay: progress * stagger,
          easing: 'ease-in-out',
          fill: 'both',
        }),
      );
      animations.push(
        path.animate([{ strokeOpacity: 1 }, { strokeOpacity: 0 }], {
          duration: fill,
          delay: fillDelay + fill,
          fill: 'both',
        }),
      );
      animations.push(
        path.animate([{ fillOpacity: 0 }, { fillOpacity: 1 }], {
          duration: fill,
          delay: fillDelay,
          easing: 'ease-out',
          fill: 'both',
        }),
      );
    }
    const pathsFinished = Promise.all(animations.map((animation) => animation.finished));
    // Unmounting or reduced motion can cancel the paths before the dock cue.
    void pathsFinished.catch(() => {});

    schedule(() => {
      captionVisible.value = true;
    }, captionDelay);

    const dockMark = () => {
      if (finished || disposed) return;
      if (document.hidden) {
        pendingDock = dockMark;
        return;
      }
      try {
        const target = document.querySelector<HTMLElement>('.app-view-content .home-brand__mark');
        if (!target) {
          complete();
          return;
        }
        const from = mark.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (!from.width || !to.width || !to.height) {
          complete();
          return;
        }
        const x = to.left + to.width / 2 - (from.left + from.width / 2);
        const y = to.top + to.height / 2 - (from.top + from.height / 2);
        const scale = to.width / from.width;
        docking.value = true;
        const dockingAnimation = mark.animate(
          [{ transform: 'translate(0, 0)' }, { transform: `translate(${x}px, ${y}px) scale(${scale})` }],
          { duration: dock, easing, fill: 'forwards' },
        );
        animations.push(dockingAnimation);
        // Hand the mark to the header and start content only after it lands.
        void dockingAnimation.finished.then(complete, () => {});
        schedule(
          () => {
            revealing.value = true;
          },
          Math.max(0, dock - revealLead),
        );
      } catch {
        complete();
      }
    };

    schedule(() => {
      // Do not cancel unfinished drawing/fill when a cold start delays frames.
      void pathsFinished.then(dockMark, () => {});
    }, dockDelay);
  } catch {
    complete();
  }
}

watch(
  () => props.playing,
  (playing) => {
    if (playing) void play();
  },
  { immediate: true, flush: 'post' },
);

onBeforeUnmount(() => {
  disposed = true;
  cleanup();
});
</script>

<template>
  <div
    ref="overlay"
    class="home-intro"
    :class="{ 'home-intro--revealing': revealing, 'home-intro--caption-visible': captionVisible && !docking }"
  >
    <div class="home-intro__scrim" aria-hidden="true" />
    <span class="home-intro__status" role="status" aria-live="polite">{{ t('common.loading') }}</span>
    <div class="home-intro__brand">
      <div ref="logo" class="home-intro__logo" aria-hidden="true">
        <NeoverseWordmark />
      </div>
      <p class="home-intro__caption"><span>{{ t('home.introSubtitle') }}</span></p>
    </div>
  </div>
</template>

<style scoped>
/* Open-source Oxanium, self-hosted under SIL OFL 1.1; see public/fonts/OFL-Oxanium.txt. */
@font-face {
  font-family: "Oxanium";
  src: url("/fonts/oxanium-latin-600-normal.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}
.home-intro { position: fixed; z-index: 120; inset: 0; overflow: hidden; pointer-events: none; }
.home-intro__scrim {
  position: absolute;
  inset: 0;
  background: var(--background-primary);
  opacity: var(--intro-scrim-opacity);
  transition: opacity var(--motion-intro-reveal-lead) var(--motion-ease-standard);
}
.home-intro--revealing .home-intro__scrim { opacity: 0; }
.home-intro__status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.home-intro__brand {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--intro-wordmark-width);
  transform: translate(-50%, -50%);
}
.home-intro__logo {
  color: var(--intro-wordmark-color);
  transform-origin: center;
}
.home-intro__caption {
  position: absolute;
  top: calc(100% + var(--intro-caption-gap));
  left: 50%;
  display: flex;
  width: max-content;
  max-width: calc(100vw - 2 * var(--page-gutter));
  align-items: center;
  justify-content: center;
  gap: var(--intro-caption-rule-gap);
  margin: 0;
  color: var(--intro-wordmark-color);
  font-family: var(--intro-caption-font);
  font-size: var(--intro-caption-size);
  font-weight: var(--weight-semibold);
  line-height: 1.2;
  letter-spacing: var(--intro-caption-tracking);
  text-align: center;
  white-space: nowrap;
  transform: translateX(-50%);
  opacity: 0;
  filter: blur(var(--intro-caption-blur));
  transition: opacity var(--motion-intro-caption) var(--motion-ease-standard),
    filter var(--motion-intro-caption) var(--motion-ease-standard);
}
.home-intro__caption::before,
.home-intro__caption::after {
  width: var(--intro-caption-rule-width);
  height: var(--neoverse-border-width-thin);
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, transparent, var(--intro-caption-rule-color) 35%, var(--intro-caption-rule-end-color));
  content: '';
}
.home-intro__caption::after { transform: scaleX(-1); }
.home-intro--caption-visible .home-intro__caption { opacity: 1; filter: blur(0); }
.home-intro__logo :deep(path) {
  fill-opacity: 0;
  stroke: currentColor;
  stroke-width: var(--intro-wordmark-stroke);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
@media (max-width: 620px) {
  .home-intro__brand { width: var(--intro-wordmark-width-narrow); }
  .home-intro__caption {
    --intro-caption-rule-width: var(--intro-caption-rule-width-narrow);
    font-size: var(--intro-caption-size-narrow);
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-intro { display: none; }
  .home-intro__scrim { transition: none; }
  .home-intro__caption { transition: none; filter: none; }
}
</style>

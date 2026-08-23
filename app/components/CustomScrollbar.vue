<script setup lang="ts">
/**
 * Immersive overlay scrollbar.
 *
 * Replaces the native document scrollbar with a frameless strip that floats
 * over the right edge of the viewport. Only the thumb is visible by default;
 * the track reveals itself on hover. The strip follows the real scrolling
 * element, re-measures after route/layout changes, supports pointer dragging
 * and track jumps, and fades out while the user is idle.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const MIN_THUMB_RATIO = 0.1;
const ROUTE_REFRESH_DELAY = 1200;
const isVisible = ref(false);
const hasScrollableContent = ref(false);
const progress = ref(0);
const thumbLengthRatio = ref(1);
const dragging = ref(false);
const dragOffset = ref(0);
const thumbElement = ref<HTMLElement | null>(null);
const trackElement = ref<HTMLElement | null>(null);
const route = useRoute();

const scroller = () => document.scrollingElement ?? document.documentElement;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getTrackRect() {
  return (
    trackElement.value?.getBoundingClientRect() ?? {
      top: 0,
      height: window.innerHeight,
    }
  );
}

function update() {
  const el = scroller();
  const scrollHeight = Math.max(el.scrollHeight, el.clientHeight);
  const maxScroll = Math.max(0, scrollHeight - el.clientHeight);
  const trackHeight = getTrackRect().height;

  progress.value = maxScroll > 0 ? clamp(el.scrollTop / maxScroll) : 0;
  thumbLengthRatio.value = trackHeight > 0 ? Math.min(1, Math.max(MIN_THUMB_RATIO, trackHeight / scrollHeight)) : 1;
  hasScrollableContent.value = maxScroll > 0;

  if (!hasScrollableContent.value) isVisible.value = false;
}

// --- auto-hide when idle ---------------------------------------------------
let hideTimer: number | undefined;

function show() {
  if (!hasScrollableContent.value) return;
  isVisible.value = true;
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    isVisible.value = false;
  }, 1200);
}

// --- drag-to-scroll --------------------------------------------------------
// The document root scrolls smoothly (see `scroll-behavior` in main.css),
// which also eases programmatic scrollTop writes. During a drag every
// pointermove writes a new target, so the page would lag behind the pointer
// with a damped feel. Position instantly for the drag session only.
function setInstantScroll(instant: boolean) {
  const el = scroller() as HTMLElement;
  if (instant) el.style.scrollBehavior = 'auto';
  else el.style.removeProperty('scroll-behavior');
}

function onPointerDown(event: PointerEvent) {
  const thumb = thumbElement.value;
  if (!thumb) return;
  const rect = thumb.getBoundingClientRect();
  if (event.clientY < rect.top || event.clientY > rect.bottom) return;

  event.preventDefault();
  event.stopPropagation();
  dragging.value = true;
  dragOffset.value = event.clientY - rect.top;
  setInstantScroll(true);
  thumb.setPointerCapture?.(event.pointerId);
  show();
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return;
  const el = scroller();
  const trackRect = getTrackRect();
  const availableTrackHeight = trackRect.height * (1 - thumbLengthRatio.value);
  if (availableTrackHeight <= 0) return;

  const target = (event.clientY - trackRect.top - dragOffset.value) / availableTrackHeight;
  el.scrollTop = clamp(target) * (el.scrollHeight - el.clientHeight);
  update();
  show();
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  setInstantScroll(false);
  thumbElement.value?.releasePointerCapture?.(event.pointerId);
}

function onTrackPointerDown(event: PointerEvent) {
  const el = scroller();
  const trackRect = getTrackRect();
  const thumbHeight = trackRect.height * thumbLengthRatio.value;
  const availableTrackHeight = trackRect.height - thumbHeight;
  if (availableTrackHeight <= 0) return;

  event.preventDefault();
  const target = (event.clientY - trackRect.top - thumbHeight / 2) / availableTrackHeight;
  el.scrollTop = clamp(target) * (el.scrollHeight - el.clientHeight);
  update();
  show();
}

// --- layout binding --------------------------------------------------------
const scrollbarStyle = computed(() => {
  const active = isVisible.value && hasScrollableContent.value;
  return {
    opacity: active ? 1 : 0,
    // While hidden the strip must not block content underneath it.
    pointerEvents: active ? ('auto' as const) : ('none' as const),
  };
});
const thumbStyle = computed(() => ({
  height: `${String(thumbLengthRatio.value * 100)}%`,
  top: `${String(progress.value * (100 - thumbLengthRatio.value * 100))}%`,
}));

let routeRefreshTimer: number | undefined;
let layoutObserver: ResizeObserver | undefined;
let routeNeedsReveal = false;

function syncLayout() {
  update();
  if (routeNeedsReveal && hasScrollableContent.value) {
    routeNeedsReveal = false;
    show();
  }
}

function refreshAfterRoute() {
  routeNeedsReveal = true;
  if (routeRefreshTimer) window.clearTimeout(routeRefreshTimer);
  void nextTick(() => {
    syncLayout();
    // Nuxt's page transition keeps the old page mounted briefly. Re-measure
    // after it has settled so a short page can never leave a stale thumb. The
    // layout observer can reveal earlier when the new page finishes sooner.
    routeRefreshTimer = window.setTimeout(() => {
      syncLayout();
      show();
    }, ROUTE_REFRESH_DELAY);
  });
}

watch(() => route.path, refreshAfterRoute);

// --- lifecycle -------------------------------------------------------------
const scrollListener = () => {
  update();
  show();
};
const resizeListener = () => {
  syncLayout();
  show();
};
const keyListener = () => show();

onMounted(() => {
  update();
  show();

  // Document scrolling is exposed consistently through window; attaching to
  // documentElement misses the event in some Chromium layouts.
  window.addEventListener('scroll', scrollListener, { passive: true });
  window.addEventListener('resize', resizeListener);
  window.addEventListener('keydown', keyListener);

  layoutObserver = new ResizeObserver(syncLayout);
  layoutObserver.observe(document.documentElement);
  layoutObserver.observe(document.body);
});

onBeforeUnmount(() => {
  if (dragging.value) setInstantScroll(false);
  if (hideTimer) window.clearTimeout(hideTimer);
  if (routeRefreshTimer) window.clearTimeout(routeRefreshTimer);
  layoutObserver?.disconnect();
  window.removeEventListener('scroll', scrollListener);
  window.removeEventListener('resize', resizeListener);
  window.removeEventListener('keydown', keyListener);
});
</script>

<template>
  <div
    ref="trackElement"
    class="immersive-scrollbar"
    :class="{ 'immersive-scrollbar--dragging': dragging }"
    :style="scrollbarStyle"
    :aria-hidden="true"
    @pointerdown="onTrackPointerDown"
  >
    <div
      ref="thumbElement"
      class="immersive-scrollbar__thumb"
      :style="thumbStyle"
      @pointerdown.stop="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
  </div>
</template>

<style scoped>
.immersive-scrollbar {
  --scrollbar-inset: 0.72rem;
  position: fixed;
  z-index: 100;
  top: max(var(--scrollbar-inset), env(safe-area-inset-top));
  right: max(0.35rem, env(safe-area-inset-right));
  bottom: max(var(--scrollbar-inset), env(safe-area-inset-bottom));
  width: 0.8rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
  user-select: none;
  transition:
    opacity 260ms var(--motion-ease-standard),
    background var(--motion-fast) var(--motion-ease-standard);
}

/* The track stays invisible until the user reaches for it. */
.immersive-scrollbar:hover,
.immersive-scrollbar--dragging {
  background: color-mix(in srgb, var(--edge-light) 40%, transparent);
}

.immersive-scrollbar__thumb {
  position: absolute;
  left: 50%;
  width: 0.3rem;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--text-secondary) 55%, transparent);
  cursor: grab;
  touch-action: none;
  transform: translateX(-50%);
  transition:
    width var(--motion-fast) var(--motion-ease-standard),
    background var(--motion-fast) var(--motion-ease-standard),
    box-shadow var(--motion-fast) var(--motion-ease-standard);
}

.immersive-scrollbar:hover .immersive-scrollbar__thumb,
.immersive-scrollbar--dragging .immersive-scrollbar__thumb {
  width: 0.42rem;
  background: color-mix(in srgb, var(--text-primary) 72%, transparent);
  box-shadow: 0 0 1rem -0.35rem color-mix(in srgb, var(--accent-primary) 60%, transparent);
}

.immersive-scrollbar--dragging .immersive-scrollbar__thumb {
  cursor: grabbing;
}

@media (prefers-reduced-motion: reduce) {
  .immersive-scrollbar,
  .immersive-scrollbar__thumb {
    transition: none;
  }
}
</style>

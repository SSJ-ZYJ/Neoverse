<script setup lang="ts">
import {
  CITY_MOTION_DURATION,
  CITY_MOTION_KEYFRAMES,
  CITY_WINDOW_HANDOFF_DURATION,
  getCityMotionElapsed,
  getCityMotionFrame,
  getCityWindowTransform,
  resetCityMotionClock,
} from '~/composables/useCityMotionClock';

type CityTransitionDirection = 'from-home' | 'to-home';

const props = defineProps<{ active: boolean; direction: CityTransitionDirection | null }>();
const emit = defineEmits<{ 'transition-end': [direction: CityTransitionDirection] }>();

const backdrop = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
let trackAnimation: Animation | undefined;

function applyWindowVars(direction: CityTransitionDirection | null) {
  const element = backdrop.value;
  if (!element || !import.meta.client) return;
  if (direction !== 'from-home' && direction !== 'to-home') {
    element.style.removeProperty('--city-window-scale');
    element.style.removeProperty('--city-window-shift-x');
    element.style.removeProperty('--city-window-shift-y');
    return;
  }
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  if (!viewW || !viewH) return;
  const elapsed = getCityMotionElapsed(performance.now());
  const targetElapsed = direction === 'to-home' ? elapsed + CITY_WINDOW_HANDOFF_DURATION : elapsed;
  const trackFrame = getCityMotionFrame(targetElapsed);
  const t = getCityWindowTransform(viewW, viewH, trackFrame);
  element.style.setProperty('--city-window-scale', String(t.scale));
  element.style.setProperty('--city-window-shift-x', `${t.shiftX}%`);
  element.style.setProperty('--city-window-shift-y', `${t.shiftY}%`);
}

const handleAnimationEnd = (event: AnimationEvent) => {
  if (props.direction === 'from-home' && event.animationName === 'section-city-pull-back') {
    emit('transition-end', 'from-home');
  }
  if (props.direction === 'to-home' && event.animationName === 'section-city-push-in') {
    // Release the persistent Home Canvas and the child track from the exact
    // same initial frame. Resetting before the emit prevents HomeCosmos from
    // jumping from the frozen handoff frame to the already elapsed return phase.
    const handoffTimestamp = performance.now();
    resetCityMotionClock(handoffTimestamp);
    if (trackAnimation) trackAnimation.currentTime = getCityMotionElapsed(handoffTimestamp);
    emit('transition-end', 'to-home');
  }
};

onMounted(() => {
  applyWindowVars(props.direction);

  const element = track.value;
  if (!element) return;

  const frames = CITY_MOTION_KEYFRAMES.map(({ offset, x, y, scale }) => ({
    offset,
    transform: `translate3d(${x}%, ${y}%, 0) scale(${scale})`,
  }));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.style.transform = frames[0]?.transform ?? 'scale(var(--city-motion-initial-scale))';
    return;
  }

  trackAnimation = element.animate(frames, {
    duration: CITY_MOTION_DURATION,
    iterations: Number.POSITIVE_INFINITY,
    easing: 'linear',
  });
  trackAnimation.currentTime = getCityMotionElapsed();
});

watch(
  () => props.direction,
  (direction) => {
    applyWindowVars(direction);
    if (direction === 'from-home' && trackAnimation) {
      trackAnimation.currentTime = getCityMotionElapsed();
    }
  },
);

onBeforeUnmount(() => {
  trackAnimation?.cancel();
});
</script>

<template>
  <div
    ref="backdrop"
    class="city-backdrop"
    :class="{ 'city-backdrop--active': active }"
    aria-hidden="true"
    @animationend="handleAnimationEnd"
  >
    <div ref="track" class="city-backdrop__track">
      <div class="city-backdrop__camera" />
    </div>
    <div class="city-backdrop__overlay" />
  </div>
</template>

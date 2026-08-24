<script setup lang="ts">
import { NAV_ITEMS } from '#shared/constants';
import { resetCityMotionClock } from '~/composables/useCityMotionClock';

const { t, locale } = useI18n();
const route = useRoute();
const { isRouteTransitioning } = useRouteTransitionState();
const isBooting = ref(true);
const pageTransitionName = ref('route-forward');
const viewIndex = (path: string) =>
  Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.path === path),
  );
const pageTransition = computed(() => ({
  name: pageTransitionName.value,
  onBeforeLeave: (el: Element) => {
    (el as HTMLElement).style.setProperty('--route-leave-shift', `${-leaveScrollOffset}px`);
  },
  onAfterEnter: settleStageAfterEnter,
}));
const skeletonView = computed(() => {
  if (route.path === '/projects') return 'projects';
  if (route.path === '/focus') return 'focus';
  if (route.path === '/pulse') return 'pulse';
  if (route.path === '/design') return 'design';
  return 'home';
});
const isSectionPath = (path: string) => NAV_ITEMS.some((item) => item.path === path && item.path !== '/');

let scrollLockTimer: number | undefined;
// Captured before the scroll resets to 0 so the outgoing page can stay glued
// to what the visitor was looking at while it slides away.
let leaveScrollOffset = 0;

const lockScrollForTransition = (timeout = 620) => {
  document.documentElement.classList.add('route-transition-scroll-lock');
  window.clearTimeout(scrollLockTimer);
  // Renewed on every navigation (no nav lock, see below); also cleared once
  // the entering page has finished its transition.
  scrollLockTimer = window.setTimeout(() => {
    document.documentElement.classList.remove('route-transition-scroll-lock');
  }, timeout);
};

// Keep the child-page backdrop painted until the leave transition ends. Dropping it
// at route-change time pulls the rug out from under the transparent
// projects/focus/pulse panels mid-slide and exposes a bare-background seam at
// the left edge once the leave transform shifts the page right.
const stageOrbitActive = ref(isSectionPath(route.path));
// `useRoute()` can still expose the old route while Nuxt is finishing the page
// transition. Keep the intended destination separately so a fast home-to-page
// transition cannot be mistaken for a transition that is returning home.
const stageTargetPath = ref(route.path);
const cityTransitionDirection = ref<'from-home' | 'to-home' | null>(null);
const homeContentSettled = ref(false);

function completeCityTransition(direction: 'from-home' | 'to-home') {
  if (cityTransitionDirection.value !== direction) return;

  if (direction === 'to-home') {
    if (stageTargetPath.value !== '/') return;
    // The Home handoff owns the last background frame. Keep the shared stage
    // mounted until CityBackdrop's camera fade has actually ended.
    stageOrbitActive.value = false;
    isRouteTransitioning.value = false;
    document.documentElement.classList.remove('route-transition-scroll-lock');
    window.clearTimeout(scrollLockTimer);
  } else if (!isSectionPath(stageTargetPath.value)) {
    return;
  }

  cityTransitionDirection.value = null;
}

function settleStageAfterEnter() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNormalHomeReturn =
    stageTargetPath.value === '/' && cityTransitionDirection.value === 'to-home' && !isReducedMotion;
  if (!isNormalHomeReturn) isRouteTransitioning.value = false;
  document.documentElement.classList.remove('route-transition-scroll-lock');
  window.clearTimeout(scrollLockTimer);

  if (stageTargetPath.value === '/') {
    // Vue can finish the page enter before the shared city animation reaches
    // its final frame. Reduced motion has no animation event; normal motion
    // is finalized by CityBackdrop when the camera fade ends.
    if (!cityTransitionDirection.value || isReducedMotion) {
      stageOrbitActive.value = false;
      cityTransitionDirection.value = null;
    }
  } else if (!isSectionPath(stageTargetPath.value)) {
    stageOrbitActive.value = false;
    cityTransitionDirection.value = null;
  }
  if (stageTargetPath.value !== '/') homeContentSettled.value = false;
}

// 过渡相关状态必须在导航起点同步就绪：实测 route.path 的 pre-flush watcher
// 会晚于过渡开始才触发，导致本次过渡用到上一次的过渡名（方向错乱）。因此
// 全部逻辑放在 router.beforeEach 里 —— 它严格早于任何渲染/过渡。
if (import.meta.client) {
  useRouter().beforeEach((to, from) => {
    if (!from || to.path === from.path) return;
    isRouteTransitioning.value = true;
    // 主页与三个正式子页共享同一段城市构图：涉及主页时由背景完成
    // 推近/拉远，子页内容只做轻微位移；只有 dock 内的非主页之间才整屏平移。
    if (to.path === '/') {
      pageTransitionName.value = 'route-to-home';
      cityTransitionDirection.value = isSectionPath(from.path) ? 'to-home' : null;
      homeContentSettled.value = isSectionPath(from.path);
      if (isSectionPath(from.path)) resetCityMotionClock();
    } else if (from.path === '/') {
      pageTransitionName.value = 'route-from-home';
      cityTransitionDirection.value = isSectionPath(to.path) ? 'from-home' : null;
    } else {
      pageTransitionName.value = viewIndex(to.path) >= viewIndex(from.path) ? 'route-forward' : 'route-back';
    }
    stageTargetPath.value = to.path;
    if (isSectionPath(to.path)) {
      stageOrbitActive.value = true;
    } else if (to.path !== '/') {
      cityTransitionDirection.value = null;
    }
    // Captured before the scroll resets to 0 so the outgoing page can stay
    // glued to what the visitor was looking at while it slides away.
    leaveScrollOffset = window.scrollY;
    lockScrollForTransition(to.path === '/' || from.path === '/' ? 920 : 620);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

useHead({
  htmlAttrs: { lang: computed(() => (locale.value === 'zh-CN' ? 'zh-CN' : 'en')) },
});

onMounted(async () => {
  const legacyView = window.location.hash.slice(1);
  const legacyTarget = NAV_ITEMS.find((item) => item.id === legacyView && item.path !== '/');
  if (route.path === '/' && legacyTarget) await navigateTo(legacyTarget.path, { replace: true });
  await new Promise((resolve) => window.setTimeout(resolve, 420));
  requestAnimationFrame(() => {
    isBooting.value = false;
  });
});
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('common.skipToContent') }}</a>
  <Transition name="boot-fade">
    <DashboardSkeleton v-if="isBooting" :view="skeletonView" />
  </Transition>
  <div
    class="app-view-stage"
    :class="{
      'app-view-stage--orbit': stageOrbitActive,
      'app-view-stage--city-from-home': cityTransitionDirection === 'from-home',
      'app-view-stage--city-to-home': cityTransitionDirection === 'to-home',
      'app-view-stage--home-restored': homeContentSettled,
    }"
  >
    <div class="app-view-background" aria-hidden="true">
      <HomeCosmos />
    </div>
    <CityBackdrop
      :active="stageOrbitActive"
      :direction="cityTransitionDirection"
      @transition-end="completeCityTransition"
    />
    <div
      class="app-view-content"
      :aria-hidden="isBooting"
      :inert="isBooting"
      :style="{ '--home-entry-animation-play-state': isBooting ? 'paused' : 'running' }"
    >
      <NuxtPage :transition="pageTransition" />
    </div>
  </div>
  <div class="bottom-chrome" :aria-hidden="isBooting" :inert="isBooting">
    <NavigationBottomDock />
    <SiteFooter />
  </div>
  <ClientOnly>
    <CustomScrollbar />
  </ClientOnly>
</template>

<style>
.bottom-chrome {
  position: fixed;
  z-index: 50;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-rows: var(--dock-height) var(--footer-track-height);
  align-items: center;
  justify-items: center;
  gap: var(--dock-footer-gap);
  padding: 0 max(0.6rem, env(safe-area-inset-right, 0px)) var(--bottom-chrome-edge-space)
    max(0.6rem, env(safe-area-inset-left, 0px));
  isolation: isolate;
  pointer-events: none;
}
.boot-fade-leave-active { transition: opacity 260ms var(--motion-ease-standard); }
.boot-fade-leave-to { opacity: 0; }
/* 手机桌面式整屏横滑：两页同速平移、全程不透明。enter/leave 的 active 类
   声明完全相同的 transform 过渡，快速连点打断时浏览器对同一属性做平滑
   retarget——中途改道不跳变，中间页自然从当前位置继续滑出（飞过效果）。 */
.route-forward-enter-active,
.route-forward-leave-active,
.route-back-enter-active,
.route-back-leave-active {
  transition: transform 350ms var(--motion-ease-emphasized);
  will-change: transform;
}
.route-forward-enter-active,
.route-back-enter-active { position: relative; z-index: 1; }
/* 只锚 top/left/right 而不设 bottom/height：离开页高度保持内容自然高度，
   不被较矮的进入页压缩裁切（滚动补偿位移后仍完整可见）。 */
.route-forward-leave-active,
.route-back-leave-active { position: absolute; z-index: 0; top: 0; left: 0; right: 0; pointer-events: none; }
.route-forward-enter-from { transform: translate3d(100%, 0, 0); }
.route-forward-leave-to { transform: translate3d(-100%, var(--route-leave-shift, 0px), 0); }
.route-back-enter-from { transform: translate3d(-100%, 0, 0); }
.route-back-leave-to { transform: translate3d(100%, var(--route-leave-shift, 0px), 0); }
/* Home and the child pages share one skyline. The fixed city backdrop performs
   the spatial pull-back/push-in while child content enters without placing its
   glass cards inside an opacity-composited ancestor. */
.route-to-home-enter-active {
  transition: opacity var(--motion-city-content) var(--motion-ease-standard)
    var(--motion-city-return-content-delay);
}
.route-from-home-enter-active {
  animation: route-child-content-reveal var(--motion-city-handoff) linear both;
}
.route-from-home-enter-active .glass-card {
  animation: route-child-card-enter var(--motion-card-entry-duration) var(--motion-ease-emphasized)
    var(--motion-city-content-delay) both;
}
.route-to-home-leave-active,
.route-from-home-leave-active {
  transition: opacity var(--motion-fast) var(--motion-ease-standard);
  will-change: opacity;
}
.route-to-home-enter-active { position: relative; z-index: 1; }
.route-to-home-leave-active { position: absolute; z-index: 2; top: var(--route-leave-shift, 0px); left: 0; right: 0; pointer-events: none; }
.route-to-home-enter-from,
.route-to-home-leave-to,
.route-from-home-leave-to { opacity: 0; }
.route-from-home-enter-active { position: relative; z-index: 2; }
.route-from-home-leave-active { position: absolute; z-index: 1; top: var(--route-leave-shift, 0px); left: 0; right: 0; pointer-events: none; }
.route-from-home-enter-from { transform: none; }
@keyframes route-child-content-reveal {
  0%,
  46% { visibility: hidden; }
  47%,
  100% { visibility: visible; }
}
@keyframes route-child-card-enter {
  from {
    opacity: 0;
    filter: blur(var(--motion-card-entry-blur));
    transform: translate3d(0, var(--motion-card-entry-distance), 0) scale(var(--motion-card-entry-scale));
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0) scale(1);
  }
}
html.route-transition-scroll-lock { overflow: hidden !important; }
@media (prefers-reduced-motion: reduce) { .boot-fade-leave-active { transition: none; } }
@media (prefers-reduced-motion: reduce) {
  .route-forward-enter-active,
  .route-forward-leave-active,
  .route-back-enter-active,
  .route-back-leave-active {
    transition: opacity 240ms var(--motion-ease-standard);
    will-change: opacity;
  }
  .route-forward-enter-from,
  .route-back-enter-from,
  .route-forward-leave-to,
  .route-back-leave-to {
    transform: translate3d(0, var(--route-leave-shift, 0px), 0);
    opacity: 0;
  }
  .route-to-home-enter-active,
  .route-to-home-leave-active,
  .route-from-home-leave-active {
    transition: opacity var(--motion-reduced-feedback) var(--motion-ease-standard);
    will-change: opacity;
  }
  .route-from-home-enter-active {
    animation: none;
    transition: none;
    will-change: auto;
  }
  .route-from-home-enter-active .glass-card {
    animation: none;
  }
  .route-to-home-enter-from,
  .route-to-home-leave-to,
  .route-from-home-leave-to {
    opacity: 0;
  }
  .route-from-home-enter-from { transform: none; }
}
@media print { .bottom-chrome { display: none; } }
</style>

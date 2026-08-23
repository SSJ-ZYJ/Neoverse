<script setup lang="ts">
import { NAV_ITEMS } from '#shared/constants';

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
}));
const skeletonView = computed(() => {
  if (route.path === '/projects') return 'projects';
  if (route.path === '/focus') return 'focus';
  if (route.path === '/pulse') return 'pulse';
  if (route.path === '/design') return 'design';
  return 'home';
});

let scrollLockTimer: number | undefined;
// Captured before the scroll resets to 0 so the outgoing page can stay glued
// to what the visitor was looking at while it slides away.
let leaveScrollOffset = 0;

const lockScrollForTransition = () => {
  document.documentElement.classList.add('route-transition-scroll-lock');
  window.clearTimeout(scrollLockTimer);
  // Renewed on every navigation (no nav lock, see below); also cleared by
  // page:transition:finish for interrupted transitions.
  scrollLockTimer = window.setTimeout(() => {
    document.documentElement.classList.remove('route-transition-scroll-lock');
  }, 620);
};

// Keep the orbit backdrop painted until the leave transition ends. Dropping it
// at route-change time pulls the rug out from under the transparent
// projects/focus/pulse panels mid-slide and exposes a bare-background seam at
// the left edge once the leave transform shifts the page right.
const stageOrbitActive = ref(skeletonView.value !== 'home');
// `useRoute()` can still expose the old route while Nuxt is finishing the page
// transition. Keep the intended destination separately so a fast home-to-page
// transition cannot be mistaken for a transition that is returning home.
const orbitTargetPath = ref(route.path);
// Arriving home, the orbit backdrop fades out instead of vanishing instantly:
// home sits on a different (bare-gradient) background, and a hard cut there is
// exactly the seam these home-specific transitions exist to avoid.
const stageOrbitFading = ref(false);
let orbitFadeTimer: number | undefined;

// 过渡相关状态必须在导航起点同步就绪：实测 route.path 的 pre-flush watcher
// 会晚于过渡开始才触发，导致本次过渡用到上一次的过渡名（方向错乱）。因此
// 全部逻辑放在 router.beforeEach 里 —— 它严格早于任何渲染/过渡。
if (import.meta.client) {
  useRouter().beforeEach((to, from) => {
    if (!from || to.path === from.path) return;
    isRouteTransitioning.value = true;
    // 主页背景不同：涉及主页的过渡不走刚性横滑，改用手机桌面"打开/收起
    // 应用"的缩放淡变语义；只有 dock 内的非主页之间才整屏平移。
    if (to.path === '/') {
      pageTransitionName.value = 'route-to-home';
    } else if (from.path === '/') {
      pageTransitionName.value = 'route-from-home';
    } else {
      pageTransitionName.value = viewIndex(to.path) >= viewIndex(from.path) ? 'route-forward' : 'route-back';
    }
    orbitTargetPath.value = to.path;
    window.clearTimeout(orbitFadeTimer);
    if (to.path !== '/') {
      stageOrbitActive.value = true;
      stageOrbitFading.value = false;
    }
    // Captured before the scroll resets to 0 so the outgoing page can stay
    // glued to what the visitor was looking at while it slides away.
    leaveScrollOffset = window.scrollY;
    lockScrollForTransition();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

useNuxtApp().hooks.hook('page:transition:finish', () => {
  isRouteTransitioning.value = false;
  document.documentElement.classList.remove('route-transition-scroll-lock');
  window.clearTimeout(scrollLockTimer);
  if (orbitTargetPath.value === '/') {
    if (stageOrbitActive.value && !stageOrbitFading.value) {
      stageOrbitFading.value = true;
      orbitFadeTimer = window.setTimeout(() => {
        if (orbitTargetPath.value !== '/') return;
        stageOrbitFading.value = false;
        stageOrbitActive.value = false;
      }, 320);
    }
  }
  // 非主页路径不做任何事：目标路径由 beforeEach 捕获，此处绝不能关闭背板。
});

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
      'app-view-stage--orbit-fade': stageOrbitFading,
    }"
    :aria-hidden="isBooting"
    :inert="isBooting"
    :style="{ '--home-entry-animation-play-state': isBooting ? 'paused' : 'running' }"
  >
    <NuxtPage :transition="pageTransition" />
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
/* 涉及主页的过渡（背景不同，不做刚性平移）：手机桌面"打开/收起应用"语义。
   回主页 = 收起应用：旧页在上层缩小淡出，主页在下层浮现；
   离开主页 = 打开应用：新页在上层放大淡入，主页在下层微微放大退场。 */
.route-to-home-enter-active,
.route-to-home-leave-active,
.route-from-home-enter-active,
.route-from-home-leave-active {
  transition:
    opacity 280ms var(--motion-ease-standard),
    transform 340ms var(--motion-ease-emphasized);
  will-change: opacity, transform;
}
.route-to-home-enter-active { position: relative; z-index: 1; }
.route-to-home-leave-active { position: absolute; z-index: 2; top: 0; left: 0; right: 0; pointer-events: none; }
.route-to-home-enter-from { opacity: 0; transform: scale(0.99); }
.route-to-home-leave-to { opacity: 0; transform: translate3d(0, var(--route-leave-shift, 0px), 0) scale(0.94); }
.route-from-home-enter-active { position: relative; z-index: 2; }
.route-from-home-leave-active { position: absolute; z-index: 1; top: 0; left: 0; right: 0; pointer-events: none; }
.route-from-home-enter-from { opacity: 0; transform: scale(0.96); }
.route-from-home-leave-to { opacity: 0; transform: translate3d(0, var(--route-leave-shift, 0px), 0) scale(1.04); }
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
  .route-from-home-enter-active,
  .route-from-home-leave-active {
    transition: opacity 240ms var(--motion-ease-standard);
    will-change: opacity;
  }
  .route-to-home-enter-from,
  .route-to-home-leave-to,
  .route-from-home-enter-from,
  .route-from-home-leave-to {
    transform: translate3d(0, var(--route-leave-shift, 0px), 0);
    opacity: 0;
  }
}
@media print { .bottom-chrome { display: none; } }
</style>

<script setup lang="ts">
import { createEmptyPulse, SITE } from '#shared/constants';

const { t } = useI18n();
const { data: pulse, status, error, refresh } = useGithubPulse();
const { isRouteTransitioning } = useRouteTransitionState();
const pulseData = computed(() => pulse.value ?? createEmptyPulse());
const pulseRequestPending = computed(() => status.value === 'idle' || status.value === 'pending');
const pulseContentReady = ref(false);
let pulseRevealFrame: number | undefined;
let pulseRevealTimer: number | undefined;

const clearPulseRevealTimers = () => {
  if (!import.meta.client) return;
  if (pulseRevealFrame !== undefined) {
    cancelAnimationFrame(pulseRevealFrame);
    pulseRevealFrame = undefined;
  }
  if (pulseRevealTimer !== undefined) {
    window.clearTimeout(pulseRevealTimer);
    pulseRevealTimer = undefined;
  }
};

const settlePulseReveal = () => {
  pulseRevealFrame = undefined;
  pulseRevealTimer = undefined;
  if (!isRouteTransitioning.value && !pulseRequestPending.value) pulseContentReady.value = true;
};

const schedulePulseReveal = () => {
  if (!import.meta.client) {
    pulseContentReady.value = true;
    return;
  }
  clearPulseRevealTimers();
  // rAF 在后台/被遮挡的标签页会被暂停：只依赖它会让揭示永久卡在骨架屏。
  // 用短超时兜底，正常情况下 rAF 先触发，超时仅作保险。
  pulseRevealFrame = requestAnimationFrame(settlePulseReveal);
  pulseRevealTimer = window.setTimeout(settlePulseReveal, 250);
};

watch(
  [isRouteTransitioning, pulseRequestPending],
  ([transitioning, pending]) => {
    if (transitioning || pending) {
      pulseContentReady.value = false;
      clearPulseRevealTimers();
      return;
    }
    schedulePulseReveal();
  },
  { immediate: true },
);

onBeforeUnmount(clearPulseRevealTimers);

const pulseDisplayLoading = computed(
  () => isRouteTransitioning.value || pulseRequestPending.value || !pulseContentReady.value,
);
const seoTitle = computed(() => `${t('pulse.title')} — ${SITE.name}`);

useSeoMeta({
  title: seoTitle,
  description: () => t('pulse.description'),
  ogTitle: seoTitle,
  ogDescription: () => t('pulse.description'),
  ogUrl: `${SITE.origin}/pulse`,
  ogImage: SITE.avatar,
  twitterCard: 'summary_large_image',
  twitterImage: SITE.avatar,
});
</script>

<template>
  <div class="neoverse-page">
    <main id="main-content" class="site-main">
      <div class="view-shell">
        <PulseSection :pulse="pulseData" :loading="pulseDisplayLoading" :error="Boolean(error)" @retry="refresh" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { createEmptyPulse, SITE } from '#shared/constants';

const { t } = useI18n();
const { data: pulse, status, error, refresh } = useGithubPulse();
const { isRouteTransitioning } = useRouteTransitionState();
const pulseData = computed(() => pulse.value ?? createEmptyPulse());
const pulseRequestPending = computed(() => status.value === 'idle' || status.value === 'pending');
const pulseContentReady = ref(true);
let pulseRevealFrame: number | undefined;

const cancelPulseReveal = () => {
  if (!import.meta.client || pulseRevealFrame === undefined) return;
  cancelAnimationFrame(pulseRevealFrame);
  pulseRevealFrame = undefined;
};

const schedulePulseReveal = () => {
  if (!import.meta.client) {
    pulseContentReady.value = true;
    return;
  }
  cancelPulseReveal();
  pulseRevealFrame = requestAnimationFrame(() => {
    pulseRevealFrame = undefined;
    if (!isRouteTransitioning.value && !pulseRequestPending.value) pulseContentReady.value = true;
  });
};

watch(
  [isRouteTransitioning, pulseRequestPending],
  ([transitioning, pending]) => {
    if (transitioning || pending) {
      pulseContentReady.value = false;
      cancelPulseReveal();
      return;
    }
    schedulePulseReveal();
  },
  { immediate: true },
);

onBeforeUnmount(cancelPulseReveal);

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

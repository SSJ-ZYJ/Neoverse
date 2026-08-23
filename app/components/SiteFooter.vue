<script setup lang="ts">
import { SITE } from '#shared/constants';

const { t } = useI18n();
</script>

<template>
  <div class="site-footer" role="group" :aria-label="t('footer.aria')">
    <a
      class="site-footer__filing"
      :href="SITE.filingUrl"
      target="_blank"
      rel="noreferrer"
    >
      {{ SITE.filingNumber }}
    </a>
  </div>
</template>

<style scoped>
.site-footer {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  min-height: var(--footer-track-height);
  min-width: 0;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.site-footer__filing {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  border-radius: var(--radius-xs);
  padding: 0.12rem 0.4rem;
  color: var(--text-muted);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  line-height: 1.15;
  pointer-events: auto;
  white-space: nowrap;
  text-decoration: none;
  transition:
    color var(--motion-fast) var(--motion-ease-standard),
    background-color var(--motion-fast) var(--motion-ease-standard);
}

.site-footer__filing:hover,
.site-footer__filing:focus-visible {
  color: var(--text-secondary);
  background: var(--dock-control-hover-fill);
}

@media (max-width: 520px) { .site-footer__filing { padding: 0.1rem 0.3rem; font-size: var(--text-md); } }

@media print { .site-footer { display: none; } }
</style>

<script setup lang="ts">
import { SITE } from '#shared/constants';

const { t } = useI18n();
const seoTitle = computed(() => `${t('focus.title')} — ${SITE.name}`);

useSeoMeta({
  title: seoTitle,
  description: () => t('focus.description'),
  ogTitle: seoTitle,
  ogDescription: () => t('focus.description'),
  ogUrl: `${SITE.origin}/focus`,
});
</script>

<template>
  <div class="neoverse-page">
    <main id="main-content" class="site-main">
      <div class="view-shell"><FocusSection /></div>
    </main>
  </div>
</template>

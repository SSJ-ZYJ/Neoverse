<script setup lang="ts">
import { SITE } from '#shared/constants';

const { t } = useI18n();
const seoTitle = computed(() => `${t('projects.title')} — ${SITE.name}`);

useSeoMeta({
  title: seoTitle,
  description: () => t('projects.description'),
  ogTitle: seoTitle,
  ogDescription: () => t('projects.description'),
  ogUrl: `${SITE.origin}/projects`,
  ogImage: SITE.avatar,
  twitterCard: 'summary_large_image',
  twitterImage: SITE.avatar,
});
</script>

<template>
  <div class="neoverse-page">
    <main id="main-content" class="site-main">
      <div class="view-shell"><ProjectSection /></div>
    </main>
  </div>
</template>

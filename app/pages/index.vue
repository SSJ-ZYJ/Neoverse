<script setup lang="ts">
import { SITE } from '#shared/constants';

const { t } = useI18n();

const seoTitle = computed(() => t('site.title'));
const seoDescription = computed(() => t('site.description'));

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogUrl: SITE.origin,
  ogType: 'website',
  ogImage: SITE.avatar,
  twitterCard: 'summary_large_image',
  twitterImage: SITE.avatar,
});
</script>

<template>
  <div class="neoverse-page">
    <main id="main-content" class="site-main">
      <div class="view-shell">
        <HomeSection />
      </div>
    </main>
  </div>
</template>

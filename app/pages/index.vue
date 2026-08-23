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
  ogImage: `${SITE.origin}/images/home-city.png`,
  twitterCard: 'summary_large_image',
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

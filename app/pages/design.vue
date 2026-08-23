<script setup lang="ts">
const { t } = useI18n();

const seoTitle = computed(() => `${t('design.title')} · Neoverse`);
const seoDescription = computed(() => t('design.description'));

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  robots: 'noindex, nofollow',
});
</script>

<template>
  <div class="neoverse-page">
    <main id="main-content" class="site-main">
      <div class="view-shell">
        <DesignSection />
      </div>
    </main>
  </div>
</template>

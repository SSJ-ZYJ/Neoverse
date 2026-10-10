<script setup lang="ts">
import wordmark from '../../public/images/neoverse.svg?raw';

// The trusted local asset is shared by the intro and the settled header.
// Normalized path lengths let every independent contour use the same draw range.
const svg = wordmark.replaceAll('<path ', '<path pathLength="1" ');
</script>

<template>
  <span class="neoverse-wordmark" aria-hidden="true" v-html="svg" />
</template>

<style scoped>
.neoverse-wordmark { display: block; aspect-ratio: 2050 / 270; }
.neoverse-wordmark :deep(svg) { display: block; width: 100%; height: 100%; overflow: visible; }
.neoverse-wordmark :deep(g) { fill: currentColor; }
</style>

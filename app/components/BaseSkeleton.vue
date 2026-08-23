<script setup lang="ts">
withDefaults(
  defineProps<{
    /** text = 单行文字；title = 标题行；avatar/circle = 圆形；rect = 圆角块 */
    variant?: 'text' | 'title' | 'avatar' | 'circle' | 'rect';
    /** 宽度，如 '100%' / '7rem' / '2.4rem'，缺省按变体默认 */
    width?: string;
    /** 高度，如 '1rem'，缺省按变体默认 */
    height?: string;
    /** 圆角覆盖，如 '1.35rem'，仅 rect 生效 */
    radius?: string;
  }>(),
  { variant: 'rect' },
);
</script>

<template>
  <span
    class="base-skeleton"
    :class="`base-skeleton--${variant}`"
    :style="{
      width,
      height,
      ...(radius ? { '--skeleton-radius': radius } : {}),
    }"
    aria-hidden="true"
  />
</template>

<style scoped>
.base-skeleton {
  position: relative;
  display: block;
  width: 100%;
  height: 1rem;
  overflow: hidden;
  border-radius: var(--skeleton-radius, var(--radius-xs));
  background: var(--skeleton-fill);
  box-shadow: var(--skeleton-edge);
}

.base-skeleton::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(
    100deg,
    transparent 30%,
    var(--skeleton-highlight) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  animation: skeleton-shimmer var(--motion-expressive) var(--motion-ease-standard) infinite;
}

.base-skeleton--text {
  height: 0.86rem;
  border-radius: var(--radius-control);
}

.base-skeleton--title {
  height: 1.15rem;
  border-radius: var(--radius-xs);
}

.base-skeleton--avatar,
.base-skeleton--circle {
  border-radius: 50%;
}

@keyframes skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}
</style>

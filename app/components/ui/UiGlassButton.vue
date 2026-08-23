<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    active?: boolean;
    filledIcon?: boolean;
    href?: string;
    size?: 'md' | 'lg' | 'sm';
    to?: string;
    variant?: 'ghost' | 'glass';
  }>(),
  {
    active: false,
    filledIcon: false,
    href: undefined,
    size: 'md',
    to: undefined,
    variant: 'glass',
  },
);

const attrs = useAttrs();
const slots = useSlots();

const hasLabel = computed(() => Boolean(slots.default));

const tag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink');
  if (props.href) return 'a';
  return 'button';
});

const targetProps = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) return { href: props.href };
  return {};
});
</script>

<template>
  <component
    :is="tag"
    v-bind="{ ...attrs, ...targetProps }"
    :class="[
      'ui-glass-button',
      `ui-glass-button--${variant}`,
      `ui-glass-button--${size}`,
      {
        'ui-glass-button--active': active,
        'ui-glass-button--filled-icon': filledIcon,
        'ui-glass-button--icon-only': !hasLabel,
      },
    ]"
    :type="tag === 'button' ? 'button' : undefined"
    :draggable="tag === 'button' ? undefined : false"
  >
    <slot name="icon" />
    <span v-if="hasLabel" class="ui-glass-button__label"><slot /></span>
  </component>
</template>

<style scoped>
.ui-glass-button {
  --_icon-size: var(--icon-size-sm);
  --_icon-stroke: var(--icon-stroke-width);
  --_label-weight: var(--weight-semibold);
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 0;
  border-radius: var(--radius-control-inner);
  padding: 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: var(--_label-weight);
  line-height: 1;
  text-decoration: none;
  background: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition: var(--transition-control);
}

.ui-glass-button--glass {
  --_label-weight: var(--weight-bold);
  color: var(--text-secondary);
  background: var(--aurora-fill);
  box-shadow: var(--shadow-edge);
  -webkit-backdrop-filter: var(--aurora-filter-control);
  backdrop-filter: var(--aurora-filter-control);
  transition:
    var(--transition-control),
    box-shadow var(--motion-fast) var(--motion-ease-standard);
}

.ui-glass-button--glass:hover,
.ui-glass-button--glass:focus-visible {
  color: var(--text-primary);
  background: var(--aurora-fill-hover);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 10%);
}

.ui-glass-button--ghost:not(.ui-glass-button--active):hover,
.ui-glass-button--ghost:not(.ui-glass-button--active):focus-visible {
  color: var(--text-primary);
}

.ui-glass-button--ghost.ui-glass-button--active {
  color: var(--accent-secondary);
  background: var(--aurora-active-fill);
  box-shadow: var(--aurora-active-highlight);
}

.ui-glass-button--sm {
  height: var(--control-height-sm);
  padding: 0.32rem 0.62rem;
  font-size: var(--text-2xs);
}

.ui-glass-button--md {
  --_icon-size: var(--icon-size-md);
  --_icon-stroke: 1.75;
  height: var(--control-height-md);
  padding: 0.4rem 0.7rem 0.5rem;
}

.ui-glass-button--lg {
  min-height: var(--control-height-lg);
  padding: 0.65rem 0.9rem;
}

.ui-glass-button--icon-only {
  gap: 0;
}

.ui-glass-button--icon-only.ui-glass-button--sm {
  width: var(--control-height-sm);
  padding: 0;
}

.ui-glass-button--icon-only.ui-glass-button--md {
  width: var(--control-height-md);
  padding: 0;
}

.ui-glass-button--icon-only.ui-glass-button--lg {
  width: var(--control-height-lg);
  min-height: var(--control-height-lg);
  padding: 0;
}

.ui-glass-button__label {
  flex: 0 0 auto;
  white-space: nowrap;
}

:slotted(svg) {
  width: var(--_icon-size);
  height: var(--_icon-size);
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: var(--_icon-stroke);
}

.ui-glass-button--filled-icon :slotted(svg) {
  fill: currentColor;
  stroke: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-glass-button {
    transition: none;
  }
}
</style>

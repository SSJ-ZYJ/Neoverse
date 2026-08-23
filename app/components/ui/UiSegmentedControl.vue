<script setup lang="ts">
export interface SegmentedOption {
  value: string;
  label: string;
  ariaLabel?: string;
}

const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    options: ReadonlyArray<SegmentedOption>;
  }>(),
  {},
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const activeIndex = computed(() =>
  Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue),
  ),
);
</script>

<template>
  <div
    class="ui-segmented-control"
    role="group"
    :aria-label="label"
    :style="{ '--segment-count': props.options.length, '--segment-index': activeIndex }"
  >
    <span class="ui-segmented-control__slider" aria-hidden="true" />
    <button
      v-for="option in options"
      :key="option.value"
      class="ui-segmented-control__option"
      :class="{ 'ui-segmented-control__option--active': option.value === modelValue }"
      type="button"
      :aria-label="option.ariaLabel ?? option.label"
      :aria-pressed="option.value === modelValue"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented-control {
  --segmented-height: var(--control-height-sm);
  --segmented-gap: 0.24rem;
  --segmented-option-min-width: 2.5rem;
  --segmented-option-padding: 0.32rem 0.62rem;
  --segmented-option-font-size: var(--text-2xs);
  position: relative;
  display: grid;
  height: var(--segmented-height);
  grid-template-columns: repeat(var(--segment-count), minmax(0, 1fr));
  align-items: stretch;
  gap: var(--segmented-gap);
}

.ui-segmented-control__slider {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: calc((100% - (var(--segment-count) - 1) * var(--segmented-gap)) / var(--segment-count));
  height: 100%;
  border-radius: var(--radius-control-inner);
  background: var(--aurora-active-fill);
  box-shadow: var(--aurora-active-highlight);
  pointer-events: none;
  transform: translateX(calc(var(--segment-index) * (100% + var(--segmented-gap))));
  transition: transform 480ms var(--motion-ease-emphasized);
  will-change: transform;
}

.ui-segmented-control__option {
  position: relative;
  z-index: 2;
  display: inline-flex;
  min-width: var(--segmented-option-min-width);
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-control-inner);
  padding: var(--segmented-option-padding);
  color: var(--text-muted);
  font-size: var(--segmented-option-font-size);
  font-weight: var(--weight-bold);
  line-height: 1;
  background: transparent;
  cursor: pointer;
  transition: var(--transition-control);
}

.ui-segmented-control__option:not(.ui-segmented-control__option--active):hover,
.ui-segmented-control__option:not(.ui-segmented-control__option--active):focus-visible {
  color: var(--text-primary);
  background: var(--aurora-hover-fill);
}

.ui-segmented-control__option--active {
  color: var(--accent-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .ui-segmented-control__slider {
    transition: none;
  }
}
</style>

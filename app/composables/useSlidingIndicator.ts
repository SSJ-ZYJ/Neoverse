import type { MaybeRefOrGetter, Ref } from 'vue';
import { computed, toValue } from 'vue';

export function useSlidingIndicator(count: MaybeRefOrGetter<number>, index: Ref<number>) {
  const slot = computed(() => 100 / Math.max(Math.trunc(toValue(count)), 1));
  const width = computed(() => `${slot.value}%`);
  const offset = computed(() => `${index.value * slot.value}%`);
  return { width, offset };
}

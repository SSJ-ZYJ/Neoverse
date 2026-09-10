<script setup lang="ts">
import { UiControlSurface, UiNavigationItem, UiSegmentedControl } from '@neoverse-ui/vue';
import type { Component } from 'vue';
import { NAV_ITEMS } from '#shared/constants';
import IconLucideActivity from '~icons/lucide/activity';
import IconLucideFolderOpen from '~icons/lucide/folder-open';
import IconLucideHouse from '~icons/lucide/house';
import IconLucideTarget from '~icons/lucide/target';

const NAV_ICONS: Record<string, Component> = {
  home: IconLucideHouse,
  projects: IconLucideFolderOpen,
  focus: IconLucideTarget,
  pulse: IconLucideActivity,
};

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const appLink = resolveComponent('NuxtLink');
const { activeView } = useViewNavigation();
const activeNavigationIndex = computed(() =>
  Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === activeView.value),
  ),
);
const hoveredNavigationId = ref<string | null>(null);
const navigationSegmentPercentage = 100 / NAV_ITEMS.length;
const hoverNavigationIndex = computed(() => {
  if (hoveredNavigationId.value === null) {
    return activeNavigationIndex.value;
  }

  const index = NAV_ITEMS.findIndex((item) => item.id === hoveredNavigationId.value);
  return Math.max(index, 0);
});
const activeIndicatorStyle = computed(() => ({
  left: `${activeNavigationIndex.value * navigationSegmentPercentage}%`,
}));
const hoverIndicatorStyle = computed(() => ({
  left: `${hoverNavigationIndex.value * navigationSegmentPercentage}%`,
}));
const { t, locale, setLocale, locales } = useI18n();
const compactNavigation = ref(false);
let compactNavigationQuery: MediaQueryList | undefined;

function updateCompactNavigation(query: MediaQueryList | MediaQueryListEvent) {
  compactNavigation.value = query.matches;
}

onMounted(() => {
  compactNavigationQuery = window.matchMedia('(max-width: 520px)');
  updateCompactNavigation(compactNavigationQuery);
  compactNavigationQuery.addEventListener('change', updateCompactNavigation);
});

onBeforeUnmount(() => {
  compactNavigationQuery?.removeEventListener('change', updateCompactNavigation);
});

const languageOptions = computed(() =>
  locales.value.map((item) => ({
    value: item.code,
    label: item.code === 'en' ? 'EN' : '中',
    ariaLabel: t('language.selectOption', {
      language: item.code === 'en' ? t('language.options.english') : t('language.options.simplifiedChinese'),
    }),
  })),
);
type LocaleCode = 'en' | 'zh-CN';

async function selectLocale(code: LocaleCode) {
  await setLocale(code);
}

// The DS segmented control is v-model based; bridge the i18n locale through
// a writable ref so locale changes flow through the same path as setLocale.
const localeRef = computed({
  get: () => locale.value,
  set: (code: string) => void selectLocale(code as LocaleCode),
});
</script>

<template>
  <UiControlSurface
    v-bind="attrs"
    as="nav"
    variant="elevated"
    class="bottom-dock consumer-parity-dock"
    data-neoverse-glass-edge-pass="css"
    :aria-label="t('nav.aria')"
  >
    <span
      class="consumer-parity-dock__active-indicator"
      aria-hidden="true"
      :style="activeIndicatorStyle"
    />
    <span
      class="consumer-parity-dock__hover-indicator"
      :class="{ 'consumer-parity-dock__hover-indicator--visible': hoveredNavigationId !== null }"
      aria-hidden="true"
      :style="hoverIndicatorStyle"
    />
    <UiNavigationItem
      v-for="item in NAV_ITEMS"
      :key="item.id"
      :as="appLink"
      :to="item.path"
      :label="t(`nav.${item.id}`)"
      class="consumer-parity-dock__item"
      :compact="compactNavigation"
      :active="activeView === item.id"
      draggable="false"
      :aria-label="t('nav.goTo', { label: t(`nav.${item.id}`) })"
      :aria-current="activeView === item.id ? 'page' : undefined"
      @pointerenter="hoveredNavigationId = item.id"
      @pointerleave="hoveredNavigationId = null"
      @focus="hoveredNavigationId = item.id"
      @blur="hoveredNavigationId = null"
    >
      <template #icon>
        <component :is="NAV_ICONS[item.id]" aria-hidden="true" />
      </template>
    </UiNavigationItem>

    <template #trailing>
      <UiSegmentedControl
        :options="languageOptions"
        v-model="localeRef"
        class="consumer-parity-dock__language"
        :aria-label="t('language.label')"
      />
    </template>
  </UiControlSurface>
</template>

<style scoped>
.bottom-dock {
  pointer-events: auto;
}

@media print {
  .bottom-dock {
    display: none;
  }
}
</style>




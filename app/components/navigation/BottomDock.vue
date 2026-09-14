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
const { t, locale, setLocale, locales } = useI18n();
const compactNavigation = ref(false);
let compactNavigationQuery: MediaQueryList | undefined;
const compactBreakpointToken = '--dock-compact-breakpoint';

function updateCompactNavigation(query: MediaQueryList | MediaQueryListEvent) {
  compactNavigation.value = query.matches;
}

onMounted(() => {
  const compactBreakpoint = getComputedStyle(document.documentElement).getPropertyValue(compactBreakpointToken).trim();
  if (compactBreakpoint.length === 0) {
    throw new Error(`Missing product token: ${compactBreakpointToken}`);
  }

  compactNavigationQuery = window.matchMedia(`(max-width: ${compactBreakpoint})`);
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
    surface="chrome"
    hover-mode="static"
    navigation-indicator
    :scale="compactNavigation ? 'md' : 'lg'"
    :class="['bottom-dock', { 'bottom-dock--compact': compactNavigation }]"
    :aria-label="t('nav.aria')"
  >
    <UiNavigationItem
      v-for="item in NAV_ITEMS"
      :key="item.id"
      :as="appLink"
      :to="item.path"
      :label="t(`nav.${item.id}`)"
      class="bottom-dock__item"
      :compact="compactNavigation"
      :active="activeView === item.id"
      draggable="false"
      :aria-label="t('nav.goTo', { label: t(`nav.${item.id}`) })"
      :aria-current="activeView === item.id ? 'page' : undefined"
    >
      <template #icon>
        <component :is="NAV_ICONS[item.id]" aria-hidden="true" />
      </template>
    </UiNavigationItem>

    <template #trailing>
      <UiSegmentedControl
        :options="languageOptions"
        v-model="localeRef"
        surface="none"
        class="bottom-dock__language"
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




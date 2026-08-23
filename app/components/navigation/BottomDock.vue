<script setup lang="ts">
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
const { activeView } = useViewNavigation();
const { t, locale, setLocale, locales } = useI18n();
const activeIndex = computed(() =>
  Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === activeView.value),
  ),
);
const hoveredIndex = ref<number | null>(null);
const visibleHoveredIndex = computed(() => (hoveredIndex.value === activeIndex.value ? null : hoveredIndex.value));
const { width: indicatorSlot, offset: activeIndicatorLeft } = useSlidingIndicator(NAV_ITEMS.length, activeIndex);
const { offset: hoverIndicatorLeft } = useSlidingIndicator(
  NAV_ITEMS.length,
  computed(() => visibleHoveredIndex.value ?? 0),
);
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

function onLocaleChange(code: string) {
  void selectLocale(code as LocaleCode);
}
</script>

<template>
  <nav v-bind="attrs" class="bottom-dock" :aria-label="t('nav.aria')">
    <div class="bottom-dock__nav" :style="{ '--indicator-slot': indicatorSlot }">
      <span class="dock-active-indicator" :style="{ left: activeIndicatorLeft, width: indicatorSlot }" aria-hidden="true" />
      <span
        class="dock-hover-indicator"
        :class="{ 'dock-hover-indicator--visible': visibleHoveredIndex !== null }"
        :style="{ left: hoverIndicatorLeft }"
        aria-hidden="true"
      />
      <UiGlassButton
        v-for="(item, index) in NAV_ITEMS"
        :key="item.id"
        variant="ghost"
        size="md"
        class="dock-nav-link"
        :to="item.path"
        :active="activeView === item.id"
        :aria-label="t('nav.goTo', { label: t(`nav.${item.id}`) })"
        :aria-current="activeView === item.id ? 'page' : undefined"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
        @focus="hoveredIndex = index"
        @blur="hoveredIndex = null"
      >
        <template #icon>
          <component :is="NAV_ICONS[item.id]" aria-hidden="true" />
        </template>
        {{ t(`nav.${item.id}`) }}
      </UiGlassButton>
    </div>

    <span class="dock-divider" aria-hidden="true" />

    <div class="dock-language-switcher">
      <UiSegmentedControl
        :options="languageOptions"
        :model-value="locale"
        :label="t('language.label')"
        @update:model-value="onLocaleChange"
      />
    </div>
  </nav>
</template>

<style scoped>
.bottom-dock {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 0;
  max-width: calc(100vw - 1.2rem);
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgb(219 234 254 / 8%);
  border-radius: var(--radius-control);
  padding: var(--dock-inset);
  isolation: isolate;
  background:
    radial-gradient(120% 150% at 7% -45%, rgb(88 195 255 / 3%), transparent 52%),
    radial-gradient(105% 150% at 94% 145%, rgb(61 214 166 / 2%), transparent 52%),
    linear-gradient(115deg, rgb(255 255 255 / 1%), rgb(255 255 255 / 0.5%) 48%, transparent 76%),
    var(--dock-glass-fill);
  box-shadow:
    0 18px 42px -20px var(--dock-glass-shadow),
    0 6px 18px -12px rgb(0 0 0 / 58%);
  -webkit-backdrop-filter: var(--aurora-filter-chrome);
  backdrop-filter: var(--aurora-filter-chrome);
  pointer-events: auto;
}

.bottom-dock__nav {
  position: relative;
  display: grid;
  width: 22rem;
  height: var(--dock-control-height);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: stretch;
}

.dock-active-indicator,
.dock-hover-indicator {
  position: absolute;
  left: 0;
  pointer-events: none;
}

.dock-active-indicator {
  z-index: 3;
  bottom: 0.08rem;
  height: 0.2rem;
  transition: left 520ms var(--motion-ease-emphasized);
}

.dock-active-indicator::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 1.7rem;
  height: 0.2rem;
  border-radius: var(--radius-pill);
  background: var(--accent-secondary);
  content: "";
  transform: translateX(-50%);
}

.dock-hover-indicator {
  z-index: 1;
  top: 0;
  width: calc(var(--indicator-slot) - 0.45rem);
  height: 100%;
  margin-left: 0.225rem;
  opacity: 0;
  border-radius: var(--radius-control);
  background: var(--aurora-hover-fill);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%);
  transition:
    left 320ms var(--motion-ease-emphasized),
    opacity 180ms var(--motion-ease-standard);
}

.dock-hover-indicator--visible {
  opacity: 1;
}

.dock-nav-link {
  z-index: 2;
  justify-self: center;
  align-self: stretch;
  width: calc(100% - 0.45rem);
}

.dock-divider {
  width: 1px;
  height: 1.4rem;
  flex: 0 0 auto;
  margin-inline: 0.08rem;
  background: rgb(219 234 254 / 14%);
}

.dock-language-switcher {
  display: inline-flex;
  height: var(--dock-control-height);
  align-items: center;
  border: 1px solid rgb(219 234 254 / 9%);
  border-radius: var(--radius-control);
  padding: 0.22rem;
  background: rgb(255 255 255 / 3%);
}

@media (max-width: 520px) {
  .bottom-dock {
    gap: 0.32rem;
  }

  .bottom-dock__nav {
    width: 11.2rem;
  }

  .dock-active-indicator::after {
    width: 1.25rem;
  }

  .dock-hover-indicator {
    width: calc(var(--indicator-slot) - 0.28rem);
    margin-left: 0.14rem;
  }

  .dock-divider {
    height: 1.2rem;
  }

  .bottom-dock__nav .dock-nav-link {
    width: calc(100% - 0.28rem);
    gap: 0;
    padding: 0.38rem 0.5rem 0.48rem;
  }

  .bottom-dock__nav .dock-nav-link :deep(.ui-glass-button__label) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .dock-language-switcher {
    --segmented-gap: 0.14rem;
    --segmented-height: 1.8rem;
    --segmented-option-min-width: 2.05rem;
    --segmented-option-padding: 0.32rem 0.42rem;
    --segmented-option-font-size: var(--text-2xs);
    padding: 0.18rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dock-active-indicator,
  .dock-hover-indicator {
    transition: none;
  }
}

@media print {
  .bottom-dock {
    display: none;
  }
}
</style>

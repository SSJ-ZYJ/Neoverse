import { cssTimeToMilliseconds } from '~/utils/homeIntroTiming';

// Keep translated copy visible in its final line layout. Animate only live
// carrier dimensions; never snapshot, fade, or scale glass and its ancestors.
const localeLayoutSelector = [
  '[data-locale-layout]',
  '.app-view-content .ui-action',
  '.app-view-content [data-surface="glass-elevated"]',
  '.app-view-content .home-panel__copy',
  '.app-view-content .home-panel__status',
].join(',');

function measureLayout(element: HTMLElement) {
  const style = getComputedStyle(element);
  return { width: style.width, height: style.height };
}

export function useLocaleTransition() {
  const animations = new Map<HTMLElement, Animation>();
  const route = useRoute();
  let revision = 0;

  function cancelAnimations() {
    revision += 1;
    for (const [element, animation] of animations) {
      animation.cancel();
      element.removeAttribute('data-locale-resizing');
    }
    animations.clear();
  }

  watch(() => route.path, cancelAnimations);
  onMounted(() => window.addEventListener('resize', cancelAnimations));
  onBeforeUnmount(() => {
    cancelAnimations();
    window.removeEventListener('resize', cancelAnimations);
  });

  async function animateLocaleChange(update: () => void) {
    const elements = [...document.querySelectorAll<HTMLElement>(localeLayoutSelector)];
    // Read the displayed size before cancelling an interrupted animation.
    const previous = elements.map(measureLayout);
    cancelAnimations();
    const currentRevision = revision;
    update();
    await nextTick();
    if (currentRevision !== revision || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const duration = cssTimeToMilliseconds(rootStyle.getPropertyValue('--motion-locale-layout'));
    const easing = rootStyle.getPropertyValue('--motion-ease-emphasized').trim();
    // Prose keeps its final available width throughout the transition. Its
    // carrier may change height, but it must not reflow text on every frame.
    const next = elements.map(measureLayout);
    elements.forEach((element, index) => {
      const before = previous[index];
      const after = next[index];
      if (!element.isConnected || !before || !after) return;
      const dimensions = element.matches('.ui-action, .home-panel__status')
        ? (['width', 'height'] as const)
        : (['height'] as const);
      const from: Keyframe = {};
      const to: Keyframe = {};
      for (const dimension of dimensions) {
        if (before[dimension] === after[dimension] || !after[dimension].endsWith('px')) continue;
        from[dimension] = before[dimension];
        to[dimension] = after[dimension];
      }
      if (Object.keys(from).length === 0) return;
      element.setAttribute('data-locale-resizing', '');
      const animation = element.animate([from, to], { duration, easing });
      animations.set(element, animation);
      const release = () => {
        if (animations.get(element) !== animation) return;
        animations.delete(element);
        element.removeAttribute('data-locale-resizing');
      };
      void animation.finished.then(release, release);
    });
  }

  return { animateLocaleChange };
}

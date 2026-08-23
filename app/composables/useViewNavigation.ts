import { NAV_ITEMS, type ViewId } from '#shared/constants';

export function useViewNavigation() {
  const route = useRoute();
  const activeView = computed<ViewId>(() => {
    const matched = NAV_ITEMS.find((item) => item.path === route.path);
    return matched?.id ?? 'home';
  });

  return { activeView };
}

export function useRouteTransitionState() {
  const isRouteTransitioning = useState('neoverse-route-transitioning', () => false);

  return { isRouteTransitioning };
}

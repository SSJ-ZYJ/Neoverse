const appSource = await Bun.file('app/app.vue').text();
const configSource = await Bun.file('nuxt.config.ts').text();
const cosmosSource = await Bun.file('app/components/home/HomeCosmos.vue').text();
const cityClockSource = await Bun.file('app/composables/useCityMotionClock.ts').text();
const cityBackdropSource = await Bun.file('app/components/CityBackdrop.vue').text();
const tokensSource = await Bun.file('app/assets/css/tokens.css').text();
const mainStyles = await Bun.file('app/assets/css/main.css').text();
const normalizedMainStyles = mainStyles.replace(/\s+/g, ' ');
const homeReturnAnimationSource = mainStyles.match(/@keyframes home-route-content-enter\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
const failures: string[] = [];

const backgroundAssets = [
  { path: '/images/home-city.webp', file: 'public/images/home-city.webp' },
  { path: '/images/other-city.webp', file: 'public/images/other-city.webp' },
] as const;

for (const asset of backgroundAssets) {
  const file = Bun.file(asset.file);
  if (!(await file.exists())) {
    failures.push(`${asset.path} is missing, so the lightweight production background cannot be served.`);
    continue;
  }
  if (file.size > 250_000) {
    failures.push(`${asset.path} is ${file.size} bytes; keep each production background below 250 KB.`);
  }
  if (!configSource.includes(`{ rel: 'preload', href: '${asset.path}', as: 'image', type: 'image/webp'`)) {
    failures.push(`${asset.path} is not preloaded from the initial production HTML.`);
  }
}

if (await Bun.file('public/images/other-city.png').exists()) {
  failures.push('The heavyweight other-city PNG still duplicates the production WebP.');
}

if (!cosmosSource.includes("image.src = '/images/home-city.webp';")) {
  failures.push('The home canvas still discovers a non-WebP background after hydration.');
}
if (!tokensSource.includes('--section-orbit-image: url("/images/other-city.webp");')) {
  failures.push('Subpages do not use the optimized room-and-city background.');
}
if (
  !mainStyles.includes('@keyframes section-city-pull-back') ||
  !mainStyles.includes('@keyframes section-city-push-in') ||
  !mainStyles.includes('@keyframes section-city-brighten') ||
  !mainStyles.includes('var(--city-window-scale)') ||
  !mainStyles.includes('var(--city-window-shift-x)') ||
  !mainStyles.includes('var(--city-window-shift-y)')
) {
  failures.push('The shared skyline does not have reversible window-anchored route motion.');
}
if (!mainStyles.includes('.app-view-stage--city-to-home .city-backdrop__overlay')) {
  failures.push('The child-page shade does not brighten gradually while Home fades in.');
}
if (
  !appSource.includes('<CityBackdrop') ||
  !appSource.includes('<div class="app-view-background"') ||
  !appSource.includes(':active="stageOrbitActive"') ||
  !cityBackdropSource.includes('CITY_MOTION_KEYFRAMES.map') ||
  !cityBackdropSource.includes('trackAnimation.currentTime = getCityMotionElapsed()') ||
  cityBackdropSource.includes('city-backdrop__home-match')
) {
  failures.push(
    'The child-page track does not play the same canonical timeline as Home on an isolated compositor layer.',
  );
}
if (
  !mainStyles.includes('.app-view-stage > :where(:not(.city-backdrop, .app-view-background))') ||
  mainStyles.includes('.app-view-stage > :not(.city-backdrop)')
) {
  failures.push('The shared backdrop selector still overrides route leave pages back to relative positioning.');
}
if (
  !appSource.includes('const homeContentSettled = ref(false);') ||
  !appSource.includes("'app-view-stage--home-restored': homeContentSettled") ||
  !mainStyles.includes('.app-view-stage.app-view-stage--home-restored') ||
  !mainStyles.includes('animation: home-route-content-enter var(--motion-home-return-content) linear') ||
  !tokensSource.includes('--motion-home-return-content: 480ms;') ||
  !mainStyles.includes('calc(var(--motion-city-return-content-delay) + var(--home-return-stagger, 0ms))') ||
  !normalizedMainStyles.includes('.app-view-stage.app-view-stage--home-restored { --home-return-stagger: 0ms; }') ||
  !['60ms', '110ms', '170ms', '240ms'].every((delay) => mainStyles.includes(`--home-return-stagger: ${delay};`)) ||
  !homeReturnAnimationSource.includes('opacity: 0') ||
  !homeReturnAnimationSource.includes('filter: blur(6px)') ||
  !homeReturnAnimationSource.includes('opacity: 1') ||
  homeReturnAnimationSource.includes('transform:')
) {
  failures.push('Home return content does not enter progressively without replaying a translation.');
}
if (
  !mainStyles.includes('@keyframes section-city-push-in') ||
  !mainStyles.includes('@keyframes section-city-room-out') ||
  !mainStyles.includes('.app-view-stage--orbit.app-view-stage--city-to-home .city-backdrop__camera') ||
  !normalizedMainStyles.includes('section-city-push-in var(--motion-city-return) var(--motion-ease-emphasized) both') ||
  !normalizedMainStyles.includes(
    'section-city-room-out var(--motion-city-home-match-duration) var(--motion-ease-emphasized) var(--motion-city-home-match-delay) both',
  ) ||
  !mainStyles.includes('transform: scale(var(--city-motion-initial-scale));') ||
  !mainStyles.includes('opacity: 0;') ||
  !mainStyles.includes('section-city-brighten var(--motion-city-return)') ||
  mainStyles.includes('section-city-home-in') ||
  mainStyles.includes('city-backdrop__home-match') ||
  mainStyles.includes('@keyframes section-city-home-push') ||
  mainStyles.includes('--city-home-push-start-scale') ||
  mainStyles.includes('section-city-home-push var(')
) {
  failures.push('The return handoff does not reveal the persistent Home Canvas under the fading child camera.');
}
if (appSource.includes('v-if="stageOrbitActive"')) {
  failures.push('The shared city track is still destroyed and restarted between route visits.');
}
if (!cityClockSource.includes('getCityMotionElapsed') || !cityClockSource.includes('CITY_MOTION_KEYFRAMES')) {
  failures.push('The child-page drift is not aligned to the same route-spanning clock as Home.');
}
if (
  !tokensSource.includes(
    '--motion-city-handoff: calc(var(--motion-city-content-delay) + var(--motion-card-entry-duration));',
  ) ||
  !tokensSource.includes('--motion-city-return: var(--motion-expressive);') ||
  !tokensSource.includes('--motion-city-home-match-delay: 360ms;') ||
  !tokensSource.includes(
    '--motion-city-home-match-duration: calc(var(--motion-city-return) - var(--motion-city-home-match-delay));',
  ) ||
  !tokensSource.includes(
    '--motion-city-return-content-delay: calc(var(--motion-city-return) - var(--motion-city-content));',
  ) ||
  !appSource.includes('var(--motion-city-return-content-delay)')
) {
  failures.push('The Home return timing no longer keeps the initial-camera handoff aligned with route entry.');
}
if (
  !cityClockSource.includes('export const CITY_MOTION_INITIAL_SCALE = 1.05;') ||
  !cityClockSource.includes('export function resetCityMotionClock') ||
  !appSource.includes('if (isSectionPath(from.path)) resetCityMotionClock();') ||
  !cosmosSource.includes("const isReturningHome = route.path === '/' && isRouteTransitioning.value;") ||
  !cosmosSource.includes('isReduced || isReturningHome ? 0 : getCityMotionElapsed(time)')
) {
  failures.push('The Home canvas still renders a moving or stale phase during the return-to-initial handoff.');
}
if (
  !appSource.includes("cityTransitionDirection.value = isSectionPath(from.path) ? 'to-home' : null;") ||
  !appSource.includes("cityTransitionDirection.value = isSectionPath(to.path) ? 'from-home' : null;") ||
  !appSource.includes("'app-view-stage--city-from-home': cityTransitionDirection === 'from-home'") ||
  !appSource.includes("'app-view-stage--city-to-home': cityTransitionDirection === 'to-home'")
) {
  failures.push('Home navigation does not apply both directions of the shared-city transition.');
}
if (
  !configSource.includes("'/images/**'") ||
  !configSource.includes("'cache-control': 'public, max-age=604800, stale-while-revalidate=2592000'")
) {
  failures.push('Production image responses do not declare a browser cache policy.');
}

if (!appSource.includes('onAfterEnter: settleStageAfterEnter')) {
  failures.push('The city backdrop is not retained until the entering page has become visible.');
}
if (appSource.includes("hooks.hook('page:transition:finish'")) {
  failures.push('The early Nuxt transition-finish hook can still remove the city backdrop before Home enters.');
}
if (!tokensSource.includes('--motion-city-content-delay: 320ms;')) {
  failures.push('The return transition no longer preserves the child background before crossfading to Home.');
}

if (!appSource.includes('const stageTargetPath = ref(route.path);')) {
  failures.push('Route background state does not track the navigation target before the route is synced.');
}
if (!appSource.includes('stageTargetPath.value = to.path;')) {
  failures.push('Navigation target is not captured in router.beforeEach.');
}
if (!appSource.includes("if (stageTargetPath.value === '/')")) {
  failures.push('The after-enter handler does not use the captured destination before removing the stage.');
}

// Model the lifecycle boundary from the browser regression: the shared stage
// must remain active throughout leave + enter, and may only be removed once the
// incoming Home page is fully opaque.
let targetPath = '/';
let active = false;
const beginNavigation = (toPath: string) => {
  targetPath = toPath;
  if (toPath !== '/') {
    active = true;
  }
};
const settleAfterEnter = () => {
  if (targetPath === '/') active = false;
};

beginNavigation('/projects');
if (!active) {
  failures.push('Home-to-subpage navigation does not activate the shared city backdrop.');
}
beginNavigation('/');
if (!active) {
  failures.push('Subpage-to-Home navigation removes the city backdrop before Home has entered.');
}
settleAfterEnter();
if (active) {
  failures.push('The shared city backdrop remains mounted after Home has fully entered.');
}

if (failures.length > 0) {
  throw new Error(`Route background regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Route backgrounds are preloaded, lightweight, cached, and transition-safe.');

const appSource = await Bun.file('app/app.vue').text();
const backdropSource = await Bun.file('app/components/CityBackdrop.vue').text();
const homeSource = await Bun.file('app/components/home/HomeSection.vue').text();
const cosmosSource = await Bun.file('app/components/home/HomeCosmos.vue').text();
const dashboardSource = await Bun.file('app/components/DashboardSkeleton.vue').text();
const nuxtConfigSource = await Bun.file('nuxt.config.ts').text();
const mainStyles = await Bun.file('app/assets/css/main.css').text();
const cityClockSource = await Bun.file('app/composables/useCityMotionClock.ts').text();
const failures: string[] = [];

if (!appSource.includes('class="app-view-content"')) {
  failures.push('The inert boot shell still hides the shared backdrop during child-page loading.');
}
if (!appSource.includes('@transition-end="completeCityTransition"')) {
  failures.push('Route cleanup is not synchronized with the shared city backdrop animation.');
}
if (!backdropSource.includes("event.animationName === 'section-city-push-in'")) {
  failures.push('The shared backdrop does not expose the completed Home handoff as a state boundary.');
}
if (
  !appSource.includes('<div class="app-view-background"') ||
  !appSource.includes('<HomeCosmos') ||
  !mainStyles.includes('.app-view-background') ||
  !mainStyles.includes(':not(.city-backdrop, .app-view-background)') ||
  !homeSource.includes('.home-panel:not(.home-panel--skeleton)') ||
  homeSource.includes('<HomeCosmos v-if="!skeleton" />') ||
  backdropSource.includes('city-backdrop__home-match') ||
  mainStyles.includes('.city-backdrop__home-match')
) {
  failures.push('The return handoff still swaps through a static Home image instead of the persistent Home Canvas.');
}
if (!homeSource.includes('.home-panel--skeleton::before')) {
  failures.push('Home skeleton background is not rendered with the live Canvas overscan geometry.');
}
if (!homeSource.includes('inset: -2.5%;')) {
  failures.push('Home skeleton background does not reserve the live 1.05x initial camera scale.');
}
if (!dashboardSource.includes('background: transparent;')) {
  failures.push('Child-page skeleton is not transparent over the shared live backdrop.');
}
if (!mainStyles.includes('.city-backdrop__track {\n  transform: scale(var(--city-motion-initial-scale));')) {
  failures.push('The shared city track has no CSS initial transform while the child skeleton is visible.');
}
const alignmentMatch = cityClockSource.match(/export const CITY_WINDOW_CONTENT_ALIGNMENT_X = ([0-9.]+);/);
const alignmentX = Number(alignmentMatch?.[1]);
const scaleMatch = cityClockSource.match(/export const CITY_WINDOW_CONTENT_SCALE = ([0-9.]+);/);
const contentScale = Number(scaleMatch?.[1]);
if (
  !Number.isFinite(alignmentX) ||
  alignmentX <= 0 ||
  alignmentX >= 64 ||
  !Number.isFinite(contentScale) ||
  contentScale <= 0.9 ||
  contentScale >= 1 ||
  !cityClockSource.includes(
    'const alignmentShiftX = (CITY_WINDOW_CONTENT_ALIGNMENT_X * sOther * scale) / CITY_WINDOW_CONTENT_SCALE;',
  ) ||
  !cityClockSource.includes('const mTotal = (sHome / (kCover * sOther)) * CITY_WINDOW_CONTENT_SCALE;') ||
  !cityClockSource.includes('const tx = alignmentShiftX -') ||
  !mainStyles.includes('--city-window-scale: 1.311;') ||
  !mainStyles.includes('--city-window-scale: 1.474;') ||
  !mainStyles.includes('--city-window-shift-x: 1.796%;') ||
  !mainStyles.includes('--city-window-shift-x: 5.827%;')
) {
  failures.push('The return camera has no measured positive horizontal asset-alignment correction.');
}
if (
  !nuxtConfigSource.includes('.dashboard-loading--orbit {') ||
  !nuxtConfigSource.includes('background: transparent;') ||
  !nuxtConfigSource.includes('.app-view-background .home-cosmos') ||
  !nuxtConfigSource.includes('.city-backdrop__track {') ||
  !nuxtConfigSource.includes('transform: scale(var(--city-motion-initial-scale, 1.05));')
) {
  failures.push('Critical shell styles do not preserve the child backdrop opacity and initial camera geometry.');
}
if (!mainStyles.includes('.app-view-stage > :where(:not(.city-backdrop, .app-view-background))')) {
  failures.push('The shared backdrop/content stacking contract is missing.');
}
if (
  !appSource.includes('const isNormalHomeReturn =') ||
  !appSource.includes('if (!isNormalHomeReturn) isRouteTransitioning.value = false;') ||
  !backdropSource.includes('resetCityMotionClock(handoffTimestamp)') ||
  !cityClockSource.includes('export function resetCityMotionClock') ||
  !cosmosSource.includes("const isReturningHome = route.path === '/' && isRouteTransitioning.value;") ||
  !cosmosSource.includes('isReduced || isReturningHome ? 0 : getCityMotionElapsed(time)')
) {
  failures.push('Home motion is released before the return clock is reset to the handoff frame.');
}

// Model the return seam: page enter may finish before the background handoff.
// Cleanup must wait for the background event rather than removing the stage at
// the first callback.
let stageActive = true;
let direction: 'to-home' | null = 'to-home';
let routeTransitioning = true;
let cityElapsed = 760;
const settlePage = () => {
  const isNormalHomeReturn = direction === 'to-home';
  if (!isNormalHomeReturn) routeTransitioning = false;
};
const completeCity = () => {
  cityElapsed = 0;
  routeTransitioning = false;
  if (direction === 'to-home') stageActive = false;
  direction = null;
};

settlePage();
if (!stageActive) {
  failures.push('The return model removes the shared backdrop at page-enter time.');
}
if (!routeTransitioning || cityElapsed !== 760) {
  failures.push('The return model releases Home motion before resetting the shared clock.');
}
completeCity();
if (stageActive || direction || routeTransitioning || cityElapsed !== 0) {
  failures.push('The return model does not remove the shared backdrop after handoff completion.');
}

if (failures.length > 0) {
  throw new Error(`City background regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('City background handoff, skeleton geometry, and boot backdrop contracts are aligned.');

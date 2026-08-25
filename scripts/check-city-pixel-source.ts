const cosmosSource = await Bun.file('app/components/home/HomeCosmos.vue').text();
const homeSource = await Bun.file('app/components/home/HomeSection.vue').text();
const clockSource = await Bun.file('app/composables/useCityMotionClock.ts').text();
const appSource = await Bun.file('app/components/DashboardSkeleton.vue').text();
const configSource = await Bun.file('nuxt.config.ts').text();
const failures: string[] = [];

if (
  !cosmosSource.includes("image.src = '/images/other-city.webp';") ||
  !cosmosSource.includes('CITY_WINDOW_RECT.x') ||
  !cosmosSource.includes('CITY_WINDOW_RECT.y') ||
  !cosmosSource.includes('CITY_WINDOW_RECT.w') ||
  !cosmosSource.includes('CITY_WINDOW_RECT.h')
) {
  failures.push('HomeCosmos is not drawing the exact window pixels from other-city.webp.');
}
if (
  !clockSource.includes('export const HOME_CITY_SIZE = { w: CITY_WINDOW_RECT.w, h: CITY_WINDOW_RECT.h } as const;') ||
  clockSource.includes('CITY_WINDOW_CONTENT_ALIGNMENT_X') ||
  clockSource.includes('CITY_WINDOW_CONTENT_SCALE')
) {
  failures.push('The camera transform still contains a compensation for two different city images.');
}
if (
  !homeSource.includes('.home-panel--skeleton {\n  background: transparent;') ||
  !homeSource.includes('.home-panel--skeleton::before {\n  display: none;') ||
  homeSource.includes("url('/images/home-city.webp')")
) {
  failures.push('The Home skeleton still paints an independent background image.');
}
if (!appSource.includes("'dashboard-loading--home': view === 'home'")) {
  failures.push('The Home skeleton does not expose a transparent shell for the shared Canvas.');
}
if (configSource.includes("href: '/images/home-city.webp'")) {
  failures.push('Initial HTML still preloads an independent Home background image.');
}

if (failures.length > 0) {
  throw new Error(`City pixel-source regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Home, child transition, and skeleton use one canonical city pixel source.');

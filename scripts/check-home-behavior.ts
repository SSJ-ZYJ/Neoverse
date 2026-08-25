import { getHomeLinkEntryDelay, getHomeStatusEntryDelay, HOME_LINK_MOTION, HOME_LINKS } from '../shared/constants';

const homeSource = await Bun.file('app/components/home/HomeSection.vue').text();
const cosmosSource = await Bun.file('app/components/home/HomeCosmos.vue').text();
const cityClockSource = await Bun.file('app/composables/useCityMotionClock.ts').text();
const skeletonSource = await Bun.file('app/components/DashboardSkeleton.vue').text();
const constantsSource = await Bun.file('shared/constants.ts').text();
const tokenSource = await Bun.file('app/assets/css/tokens.css').text();
const nuxtConfigSource = await Bun.file('nuxt.config.ts').text();

const failures: string[] = [];

if (!cityClockSource.includes('export const CITY_MOTION_DURATION = 24_000;')) {
  failures.push('Home and child-page city motion do not share one canonical 24-second timeline.');
}
if (!cityClockSource.includes('const CITY_MOTION_SEGMENTS = 64;')) {
  failures.push('The shared city trajectory is not sampled finely enough for a seamless compositor handoff.');
}
if (!cosmosSource.includes('getCityMotionElapsed(time)')) {
  failures.push('Home city motion is not reading the shared route-spanning city clock.');
}
if (!cosmosSource.includes('getCityMotionFrame(loopTime)')) {
  failures.push('Home does not render from the same canonical motion frames as the child-page backdrop.');
}
if (cosmosSource.includes('animationStartedAt')) {
  failures.push(
    'Home city motion still resets to a mount-local phase instead of continuing the child-page trajectory.',
  );
}

if (!constantsSource.includes('export const HOME_LINKS')) {
  failures.push('Home links are not defined as shared canonical data.');
}
if (!homeSource.includes('v-for="(link, index) in HOME_LINKS"')) {
  failures.push('Home links are not rendered from the canonical list.');
}
if (!skeletonSource.includes('<HomeSection v-if="view === \'home\'" skeleton />')) {
  failures.push('Home skeleton does not reuse the canonical HomeSection layout and link count.');
}
if (skeletonSource.includes('class="dashboard-loading__profile"')) {
  failures.push('DashboardSkeleton still duplicates the canonical Home layout.');
}
if (/\.home-socials a:nth-child\(/.test(homeSource)) {
  failures.push('Home link animation timing is still hard-coded to fixed child positions.');
}
if (!homeSource.includes("'--home-link-entry-delay'")) {
  failures.push('Home links do not receive data-driven animation delays.');
}

const currentFinalLinkDelay = getHomeLinkEntryDelay(HOME_LINKS.length - 1);
const currentStatusDelay = getHomeStatusEntryDelay(HOME_LINKS.length);
const expectedStatusDelay = currentFinalLinkDelay;
if (currentStatusDelay !== expectedStatusDelay) {
  failures.push('Currently Building must begin its fade when the final link starts entering.');
}
const finalStaggerSlot = HOME_LINK_MOTION.maxStaggeredLinks - 1;
if (getHomeLinkEntryDelay(99) !== getHomeLinkEntryDelay(finalStaggerSlot)) {
  failures.push('Home link animation staggering is not capped for future link growth.');
}

const contentRule = homeSource.match(/\.home-panel__content\s*\{([^}]*)\}/)?.[1] ?? '';
for (const requiredLayout of [
  'display: grid',
  'max-width: var(--home-content-max)',
  'grid-template-areas:',
  'margin-inline: 0 auto',
]) {
  if (!contentRule.includes(requiredLayout)) {
    failures.push(`Home content is missing the stable layout rule: ${requiredLayout}.`);
  }
}
if (!tokenSource.includes('--home-content-max:')) {
  failures.push('Home content width is not defined by a design token.');
}
if (/@media \(min-width:\s*1200px\)[\s\S]*?\.home-panel__content/.test(homeSource)) {
  failures.push('Home content still changes its horizontal alignment at the 1200px breakpoint.');
}

const statusRule = homeSource.match(/^\.home-panel__status\s*\{([^}]*)\}/m)?.[1] ?? '';
if (!statusRule.includes('animation: home-status-enter')) {
  failures.push('Currently Building does not have an independent fade animation.');
}
if (!statusRule.includes('animation: home-status-enter var(--motion-standard)')) {
  failures.push('Currently Building must retain the standard fade duration while starting earlier.');
}
if (!statusRule.includes('var(--home-status-entry-delay)')) {
  failures.push('Currently Building does not wait for the data-driven final link delay.');
}

const reducedMotionBlock = homeSource.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1];
if (!reducedMotionBlock?.includes('.home-panel__status')) {
  failures.push('Currently Building is not covered by the reduced-motion fallback.');
}

if (/detectBrowserLanguage:\s*false/.test(nuxtConfigSource)) {
  failures.push('Browser language detection is disabled.');
}
for (const requiredConfig of [
  /useCookie:\s*true/,
  /cookieKey:\s*['"]neoverse_locale['"]/,
  /redirectOn:\s*['"]all['"]/,
  /fallbackLocale:\s*['"]en['"]/,
]) {
  if (!requiredConfig.test(nuxtConfigSource)) {
    failures.push(`Missing locale detection setting: ${requiredConfig.source}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Home behavior regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Home layout, dynamic link timing, and first-visit locale detection are configured correctly.');

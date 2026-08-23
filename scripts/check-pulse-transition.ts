const appSource = await Bun.file('app/app.vue').text();
const pulseSource = await Bun.file('app/pages/pulse.vue').text();
const landscapeSource = await Bun.file('app/components/pulse/ContributionLandscape.vue').text();
const failures: string[] = [];

if (!appSource.includes('isRouteTransitioning.value = true')) {
  failures.push('Route navigation does not mark the transition as active before Pulse mounts.');
}
if (!appSource.includes('isRouteTransitioning.value = false')) {
  failures.push('The page transition finish hook does not release the transition state.');
}
if (!pulseSource.includes('useRouteTransitionState')) {
  failures.push('Pulse does not consume the shared route transition state.');
}
if (!pulseSource.includes('pulseContentReady')) {
  failures.push('Pulse does not defer heavy content until the transition is complete.');
}
if (!pulseSource.includes(':loading="pulseDisplayLoading"')) {
  failures.push('PulseSection is still driven directly by the request status.');
}
if (landscapeSource.includes('v-for="cell in 371" :key="cell" class="skeleton-surface"')) {
  failures.push('Contribution loading still creates one animated skeleton surface per cell.');
}
if (!landscapeSource.includes('class="contribution-card__skeleton-grid"')) {
  failures.push('Contribution loading does not use one shared static skeleton grid.');
}

if (failures.length > 0) {
  throw new Error(`Pulse transition regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Pulse transition gating and shared loading skeleton are configured.');

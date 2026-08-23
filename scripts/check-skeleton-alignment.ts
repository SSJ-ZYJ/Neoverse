const dashboardSource = await Bun.file('app/components/DashboardSkeleton.vue').text();
const landscapeSource = await Bun.file('app/components/pulse/ContributionLandscape.vue').text();
const projectsSource = await Bun.file('app/components/pulse/ContributionProjects.vue').text();
const baseSkeletonSource = await Bun.file('app/components/BaseSkeleton.vue').text();
const mainStyles = await Bun.file('app/assets/css/main.css').text();
const tokenSource = await Bun.file('app/assets/css/tokens.css').text();
const failures: string[] = [];

if (!dashboardSource.includes('<PulseSection :pulse="emptyPulse" :loading="true" />')) {
  failures.push('Initial Pulse loading does not reuse the live Pulse loading shell.');
}
if (dashboardSource.includes('<div class="dashboard-loading__contribution-card">')) {
  failures.push('DashboardSkeleton still contains a duplicate Pulse contribution card skeleton.');
}
if (!dashboardSource.includes('FOCUS_DOMAINS')) {
  failures.push('Focus skeleton is not driven by the canonical focus domain count.');
}
if (!landscapeSource.includes('class="contribution-card__skeleton-grid"')) {
  failures.push('Live contribution loading is missing the shared skeleton grid geometry.');
}
if (!landscapeSource.includes('class="contribution-card__legend contribution-card__legend--chart"')) {
  failures.push('Live contribution skeleton is missing the chart legend geometry.');
}
if (!projectsSource.includes('repository-distribution__track--skeleton')) {
  failures.push('Repository loading skeleton does not reuse the real distribution track geometry.');
}
if (!projectsSource.includes('v-for="row in 4"')) {
  failures.push('Repository loading skeleton does not reserve all real distribution rows.');
}
if (!tokenSource.includes('--skeleton-fill:')) {
  failures.push('Skeleton color is not defined as a design token.');
}
if (!mainStyles.includes('background: var(--skeleton-fill);')) {
  failures.push('Global skeleton surface does not use the shared visible fill token.');
}
if (!baseSkeletonSource.includes('background: var(--skeleton-fill);')) {
  failures.push('BaseSkeleton does not use the shared visible fill token.');
}

if (failures.length > 0) {
  throw new Error(`Skeleton alignment check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Pulse, Focus, Projects, and shared skeleton geometry/color contracts are configured.');

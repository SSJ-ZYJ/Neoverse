const dashboardSource = await Bun.file('app/components/DashboardSkeleton.vue').text();
const appSource = await Bun.file('app/app.vue').text();
const landscapeSource = await Bun.file('app/components/pulse/ContributionLandscape.vue').text();
const projectsSource = await Bun.file('app/components/pulse/ContributionProjects.vue').text();
const baseSkeletonSource = await Bun.file('app/components/BaseSkeleton.vue').text();
const mainStyles = await Bun.file('app/assets/css/main.css').text();
const tokenSource = await Bun.file('app/assets/css/tokens.css').text();
const failures: string[] = [];

if (!appSource.includes("if (route.path === '/design') return 'design';")) {
  failures.push('The /design route still falls back to the Home boot skeleton.');
}
if (!dashboardSource.includes("type SkeletonView = ViewId | 'design';")) {
  failures.push('DashboardSkeleton does not declare a dedicated Design view.');
}
if (!dashboardSource.includes("view === 'design'")) {
  failures.push('DashboardSkeleton does not render a dedicated Design skeleton.');
}
if (!dashboardSource.includes('.dashboard-loading__panel {\n  min-height: 0;')) {
  failures.push('Non-Home boot skeletons still force viewport height instead of mirroring natural page height.');
}
if (!dashboardSource.includes('@media (max-width: 760px)')) {
  failures.push('Focus skeleton does not mirror the live 760px compact-spacing breakpoint.');
}
if (!dashboardSource.includes("url('/images/home-city.webp') center / cover no-repeat")) {
  failures.push('Home boot skeleton does not reuse the live Home backdrop on narrow screens.');
}
if (!dashboardSource.includes('border-radius: 24%;')) {
  failures.push('Home boot skeleton avatar does not match the live avatar geometry.');
}

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

console.log('Home, Projects, Focus, Pulse, Design, and shared skeleton contracts are aligned.');

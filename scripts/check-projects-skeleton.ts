const dashboardSource = await Bun.file('app/components/DashboardSkeleton.vue').text();
const appSource = await Bun.file('app/app.vue').text();
const backdropSource = await Bun.file('app/components/CityBackdrop.vue').text();
const mainStyles = await Bun.file('app/assets/css/main.css').text();
const failures: string[] = [];

if (!dashboardSource.includes('class="dashboard-loading__project-preview-row"')) {
  failures.push('Projects boot preview still renders each row as one joined skeleton block.');
}
if (!dashboardSource.includes('dashboard-loading__project-preview-line--primary')) {
  failures.push('Projects boot preview rows do not contain separate rounded text lines.');
}

const orbitRule = dashboardSource.match(/\.dashboard-loading--orbit\s*\{([^}]*)\}/)?.[1] ?? '';
if (!orbitRule.includes('background: transparent;')) {
  failures.push(
    'Projects boot skeleton still paints a separate orbit background instead of revealing the live backdrop.',
  );
}
if (orbitRule.includes('--section-orbit-background')) {
  failures.push('Projects boot skeleton still duplicates the live orbit image and can use a different crop or scale.');
}
if (
  !appSource.includes('<CityBackdrop') ||
  !appSource.includes(':active="stageOrbitActive"') ||
  !appSource.includes('class="app-view-content"') ||
  !backdropSource.includes('city-backdrop--active') ||
  !mainStyles.includes('.city-backdrop__camera') ||
  !mainStyles.includes('background: var(--section-orbit-image) center / cover no-repeat')
) {
  failures.push('The shared live orbit backdrop contract is missing.');
}

if (failures.length > 0) {
  throw new Error(`Projects skeleton regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Projects skeleton preview geometry and orbit backdrop are aligned with the live page.');

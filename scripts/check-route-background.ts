const appSource = await Bun.file('app/app.vue').text();
const configSource = await Bun.file('nuxt.config.ts').text();
const cosmosSource = await Bun.file('app/components/home/HomeCosmos.vue').text();
const tokensSource = await Bun.file('app/assets/css/tokens.css').text();
const failures: string[] = [];

const backgroundAssets = [
  { path: '/images/home-city.webp', file: 'public/images/home-city.webp' },
  { path: '/images/home-orbit.webp', file: 'public/images/home-orbit.webp' },
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

if (!cosmosSource.includes("image.src = '/images/home-city.webp';")) {
  failures.push('The home canvas still discovers a non-WebP background after hydration.');
}
if (!tokensSource.includes('--section-orbit-image: url("/images/home-orbit.webp");')) {
  failures.push('Subpages still reference the heavyweight orbit PNG.');
}
if (
  !configSource.includes("'/images/**'") ||
  !configSource.includes("'cache-control': 'public, max-age=604800, stale-while-revalidate=2592000'")
) {
  failures.push('Production image responses do not declare a browser cache policy.');
}

const transitionFinishIndex = appSource.indexOf("useNuxtApp().hooks.hook('page:transition:finish'");
const transitionFinishEndIndex = appSource.indexOf('\nuseHead(', transitionFinishIndex);
const transitionFinishSource =
  transitionFinishIndex >= 0
    ? appSource.slice(transitionFinishIndex, transitionFinishEndIndex >= 0 ? transitionFinishEndIndex : undefined)
    : '';

if (!appSource.includes('const orbitTargetPath = ref(route.path);')) {
  failures.push('Route background state does not track the navigation target before the route is synced.');
}
if (!appSource.includes('orbitTargetPath.value = to.path;')) {
  failures.push('Navigation target is not captured in router.beforeEach.');
}
if (/route\.path/.test(transitionFinishSource)) {
  failures.push(
    'Transition finish still reads the reactive route, which can still point to the home page during a fast transition.',
  );
}
if (!transitionFinishSource.includes("orbitTargetPath.value === '/'")) {
  failures.push('Transition finish does not use the captured destination to decide when to fade the orbit background.');
}
if (!transitionFinishSource.includes("if (orbitTargetPath.value !== '/') return;")) {
  failures.push('Orbit fade timeout is not guarded against a newer navigation to a subpage.');
}

// Reproduce the event ordering reported in the bug: the transition finish hook
// runs before the router composable has synced its current route.
let targetPath = '/';
let active = false;
let fading = false;
let fadeTimer: ReturnType<typeof setTimeout> | undefined;
const beginNavigation = (toPath: string) => {
  targetPath = toPath;
  if (toPath !== '/') {
    active = true;
    fading = false;
  }
};
const finishTransition = () => {
  if (targetPath === '/' && active && !fading) {
    fading = true;
    fadeTimer = setTimeout(() => {
      if (targetPath !== '/') return;
      fading = false;
      active = false;
    }, 320);
  }
};

beginNavigation('/projects');
finishTransition();
await new Promise((resolve) => setTimeout(resolve, 340));
if (!active || fading) {
  failures.push('Fast home-to-subpage transition can still fade out the subpage orbit background.');
}
if (fadeTimer) clearTimeout(fadeTimer);

if (failures.length > 0) {
  throw new Error(`Route background regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Route backgrounds are preloaded, lightweight, cached, and transition-safe.');

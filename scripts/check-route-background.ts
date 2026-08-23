const appSource = await Bun.file('app/app.vue').text();
const failures: string[] = [];

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

console.log('Fast home-to-subpage transitions keep the orbit background active.');

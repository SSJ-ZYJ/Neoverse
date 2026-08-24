const appSource = await Bun.file('app/app.vue').text();
const tokenSource = await Bun.file('app/assets/css/tokens.css').text();
const failures: string[] = [];

const enterRule = appSource.match(/\.route-from-home-enter-active\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
const enterFromRule = appSource.match(/\.route-from-home-enter-from\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
const cardEnterRule = appSource.match(/\.route-from-home-enter-active \.glass-card\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

if (!enterRule.includes('animation: route-child-content-reveal var(--motion-city-handoff) linear both')) {
  failures.push('Home-to-child content is not held in place until the shared background has opened.');
}
if (/transition:\s*(?:opacity|transform)/.test(enterRule) || /will-change:\s*(?:opacity|transform)/.test(enterRule)) {
  failures.push('Home-to-child entry places glass cards inside an opacity-composited ancestor.');
}
if (!enterFromRule.includes('transform: none')) {
  failures.push('Home-to-child entry still shifts the incoming cards vertically.');
}
if (/\.route-from-home-enter-from,\s*\.route-from-home-leave-to\s*\{[\s\S]*?opacity:\s*0/.test(appSource)) {
  failures.push('The incoming child page still inherits the old opacity-zero enter state.');
}
if (!appSource.includes('@keyframes route-child-content-reveal')) {
  failures.push('Home-to-child content has no deterministic visibility-only reveal timeline.');
}
if (!appSource.includes('.route-from-home-enter-active .glass-card')) {
  failures.push('Home-to-child cards still appear without their own entry animation.');
}
if (
  !/animation:\s*route-child-card-enter\s+var\(--motion-card-entry-duration\)\s+var\(--motion-ease-emphasized\)\s+var\(--motion-city-content-delay\)\s+both/.test(
    cardEnterRule,
  )
) {
  failures.push('Home-to-child cards do not use a delayed smooth entry animation.');
}
const cardDuration = Number(tokenSource.match(/--motion-card-entry-duration:\s*(\d+)ms/)?.[1] ?? 0);
if (cardDuration < 320) {
  failures.push('Home-to-child card entry is still too short to read as a smooth animation.');
}
if (
  !tokenSource.includes(
    '--motion-city-handoff: calc(var(--motion-city-content-delay) + var(--motion-card-entry-duration));',
  )
) {
  failures.push('Home-to-child content handoff does not cover the full card entry animation.');
}
if (!appSource.includes('@keyframes route-child-card-enter')) {
  failures.push('Home-to-child cards have no smooth fade/deblur keyframes.');
}
if (
  !appSource.includes(
    'transform: translate3d(0, var(--motion-card-entry-distance), 0) scale(var(--motion-card-entry-scale));',
  )
) {
  failures.push('Home-to-child cards do not visibly lift into place during entry.');
}
if (!appSource.includes('transform: translate3d(0, 0, 0) scale(1);')) {
  failures.push('Home-to-child cards do not settle to their final scale after entry.');
}
if (!appSource.includes('.route-from-home-enter-active {\n    animation: none;')) {
  failures.push('Reduced-motion entry does not disable the child-page movement.');
}
if (!appSource.includes('.route-from-home-enter-active .glass-card {\n    animation: none;')) {
  failures.push('Reduced-motion entry does not disable the child-card animation.');
}

if (failures.length > 0) {
  throw new Error(`Card transition regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Home-to-child transitions keep glass cards out of opacity-composited ancestors.');

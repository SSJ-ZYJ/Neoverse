const landscapeSource = await Bun.file('app/components/pulse/ContributionLandscape.vue').text();
const tokensSource = await Bun.file('app/assets/css/tokens.css').text();
const failures: string[] = [];

if (!landscapeSource.includes('ref="chartScroller"')) {
  failures.push('The contribution chart scroll container is not addressable after rendering.');
}
if (!landscapeSource.includes('scrollToLatestContributions')) {
  failures.push('The contribution chart has no initial alignment step for the latest dates.');
}
if (!landscapeSource.includes('await nextTick();')) {
  failures.push('The contribution chart measures its overflow before Vue has rendered the latest days.');
}
if (!landscapeSource.includes('scroller.scrollLeft = scroller.scrollWidth;')) {
  failures.push('The contribution chart does not move an overflowing viewport to its rightmost edge.');
}
if (
  !landscapeSource.includes('onMounted(scrollToLatestContributions);') &&
  !landscapeSource.includes('onMounted(() =>')
) {
  failures.push('The contribution chart does not align to the latest dates after mounting.');
}
if (!landscapeSource.includes('contributions.days.at(-1)?.date')) {
  failures.push('The contribution chart does not realign when asynchronously loaded days change.');
}
if (!landscapeSource.includes('@pointerdown="onChartPointerDown"')) {
  failures.push('The contribution chart does not start a pointer drag session at narrow widths.');
}
if (!landscapeSource.includes('@pointermove="onChartPointerMove"')) {
  failures.push('The contribution chart does not track horizontal pointer movement.');
}
if (!landscapeSource.includes('@pointerup="onChartPointerUp"')) {
  failures.push('The contribution chart has no release step for inertia and edge rebound.');
}
if (!landscapeSource.includes('@pointercancel="onChartPointerCancel"')) {
  failures.push('The contribution chart does not clean up cancelled pointer drags.');
}
if (!landscapeSource.includes('startChartInertia')) {
  failures.push('The contribution chart does not continue with release inertia.');
}
if (!landscapeSource.includes('startChartEdgeSpring')) {
  failures.push('The contribution chart does not spring back after an edge pull.');
}
if (!landscapeSource.includes('touch-action: pan-y')) {
  failures.push('The contribution chart does not preserve vertical page scrolling while dragging horizontally.');
}
if (!landscapeSource.includes('props.contributions.days.length')) {
  failures.push('The contribution chart does not realign after the async day layout has materialized.');
}
if (!landscapeSource.includes('onUpdated(() =>')) {
  failures.push('The contribution chart does not realign after the hydrated grid has been updated.');
}
if (!landscapeSource.includes('new MutationObserver')) {
  failures.push('The contribution chart does not realign after its rendered cells are replaced.');
}
if (!landscapeSource.includes('new ResizeObserver')) {
  failures.push('The contribution chart does not realign after its rendered width settles.');
}
if (!landscapeSource.includes('springDamping: 0.6')) {
  failures.push('The contribution chart spring allows more than one rebound.');
}
if (!tokensSource.includes('--pulse-heatmap-spring-damping: 0.6;')) {
  failures.push('The contribution chart spring damping token is not tuned for a single rebound.');
}

if (failures.length > 0) {
  throw new Error(`Pulse mobile heatmap regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Overflowing contribution heatmaps initially align to the latest date.');

const landscapeSource = await Bun.file('app/components/pulse/ContributionLandscape.vue').text();
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
if (!landscapeSource.includes('onMounted(scrollToLatestContributions);')) {
  failures.push('The contribution chart does not align to the latest dates after mounting.');
}
if (!landscapeSource.includes('contributions.days.at(-1)?.date')) {
  failures.push('The contribution chart does not realign when asynchronously loaded days change.');
}

if (failures.length > 0) {
  throw new Error(`Pulse mobile heatmap regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Overflowing contribution heatmaps initially align to the latest date.');

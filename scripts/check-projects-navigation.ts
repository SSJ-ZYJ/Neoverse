const sectionSource = await Bun.file('app/components/project/ProjectSection.vue').text();
const composableSource = await Bun.file('app/composables/useProjectPreviews.ts').text();

const failures: string[] = [];

if (/await\s+useProjectPreviews\s*\(/.test(sectionSource)) {
  failures.push('Projects still waits for preview data during component setup.');
}
if (!composableSource.includes('useLazyFetch<ProjectPreviews>')) {
  failures.push('Projects preview fetching is not explicitly navigation-lazy.');
}
if (!sectionSource.includes(':loading="previewLoading"')) {
  failures.push('Project cards do not receive a local preview loading state.');
}

if (failures.length > 0) {
  throw new Error(`Projects navigation regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Projects renders without awaiting remote previews and exposes local loading state.');

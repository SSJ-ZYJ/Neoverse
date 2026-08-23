const cardSource = await Bun.file('app/components/project/ProjectCard.vue').text();
const sectionSource = await Bun.file('app/components/project/ProjectSection.vue').text();
const skeletonSource = await Bun.file('app/components/DashboardSkeleton.vue').text();

const failures: string[] = [];
const cardMobileStyles = cardSource.split('@media (max-width: 520px)')[1] ?? '';
const skeletonMobileStyles = skeletonSource.split('@media (max-width: 520px)')[1] ?? '';

if (!sectionSource.includes('minmax(min(100%, 24rem), 1fr)')) {
  failures.push('Projects list no longer allows a card column to shrink to the mobile content width.');
}
if (!cardMobileStyles.includes('aspect-ratio: 4 / 3')) {
  failures.push('Project previews do not gain enough vertical space on mobile.');
}
if (!cardMobileStyles.includes('.project-card__docs-list span { display: none; }')) {
  failures.push('Mobile docs previews still render four secondary description rows in the compact frame.');
}
if (!cardMobileStyles.includes('.project-card__preview-head small { max-width: 46%; }')) {
  failures.push('The project host can crowd the preview title on narrow screens.');
}
if (!skeletonMobileStyles.includes('aspect-ratio: 4 / 3')) {
  failures.push('The Projects loading skeleton does not match the mobile preview geometry.');
}

if (failures.length > 0) {
  throw new Error(`Projects mobile regression check failed:\n- ${failures.join('\n- ')}`);
}

console.log('Projects cards and loading skeleton retain their compact mobile layout.');

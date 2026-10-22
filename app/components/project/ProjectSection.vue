<script setup lang="ts">
import { UiBadge, UiCard, UiSkeleton } from '@neoverse-ui/vue';
import { createEmptyProjectPreviews, PRACTICE_PROJECTS, PROJECTS } from '#shared/constants';

const props = withDefaults(defineProps<{ skeleton?: boolean }>(), { skeleton: false });
const practiceProjects = PRACTICE_PROJECTS;
const { t } = useI18n();
const previewRequest = props.skeleton ? null : useProjectPreviews();
const emptyPreviews = createEmptyProjectPreviews();
const previews = computed(() => previewRequest?.data.value ?? emptyPreviews);
const previewLoading = computed(
  () => previewRequest?.status.value === 'idle' || previewRequest?.status.value === 'pending',
);
const PRACTICE_SKELETON_LINE_COUNTS: Record<(typeof practiceProjects)[number]['id'], number> = {
  ui: 3,
  nexus: 6,
  xca: 5,
};
</script>

<template>
  <section
    :id="skeleton ? undefined : 'projects'"
    class="dashboard-panel project-panel"
    :aria-labelledby="skeleton ? undefined : 'projects-title'"
    :aria-hidden="skeleton || undefined"
  >
    <header class="panel-header">
      <h2 :id="skeleton ? undefined : 'projects-title'" class="panel-title">
        <UiSkeleton v-if="skeleton" variant="rect" class="project-panel__title-skeleton" />
        <template v-else>{{ t('projects.title') }}</template>
      </h2>
      <p class="panel-description">
        <template v-if="skeleton">
          <UiSkeleton variant="rect" class="project-panel__description-skeleton" />
          <UiSkeleton variant="rect" class="project-panel__description-skeleton project-panel__description-skeleton--second" />
        </template>
        <template v-else>{{ t('projects.description') }}</template>
      </p>
    </header>

    <div class="project-panel__list">
      <ProjectCard
        v-for="project in PROJECTS"
        :key="project.id"
        :project="project"
        :preview="project.id === 'docs' ? previews.docs : previews.blog"
        :loading="previewLoading"
        :skeleton="skeleton"
      />
    </div>

    <section class="project-panel__practice">
      <div class="project-panel__practice-list">
        <UiCard
          v-for="project in practiceProjects"
          :key="project.id"
          as="article"
          surface="glass-elevated"
          class="project-panel__practice-card"
        >
          <template v-if="skeleton">
            <div class="project-panel__practice-top">
              <UiSkeleton variant="rect" class="project-panel__practice-category-skeleton" />
              <UiSkeleton
                variant="rect"
                class="project-panel__practice-status-skeleton"
                :class="`project-panel__practice-status-skeleton--${project.id}`"
              />
            </div>
            <UiSkeleton variant="rect" class="project-panel__practice-card-title-skeleton" />
            <p class="project-panel__practice-description-skeleton">
              <UiSkeleton
                variant="rect"
                v-for="line in PRACTICE_SKELETON_LINE_COUNTS[project.id]"
                :key="line"
              />
            </p>
            <UiSkeleton v-if="project.href" variant="rect" class="project-panel__practice-link-skeleton" />
          </template>
          <template v-else>
            <div class="project-panel__practice-top">
              <span class="project-panel__practice-category">{{ t(`projects.practice.${project.id}.category`) }}</span>
              <UiBadge variant="neutral" size="sm">{{ t(`projects.practiceStatus.${project.status}`) }}</UiBadge>
            </div>
            <h4>{{ t(`projects.practice.${project.id}.title`) }}</h4>
            <p>{{ t(`projects.practice.${project.id}.description`) }}</p>
            <a v-if="project.href" :href="project.href" target="_blank" rel="noreferrer">
              {{ t('projects.viewSource') }} <span aria-hidden="true">↗</span>
            </a>
          </template>
        </UiCard>
      </div>
    </section>
  </section>
</template>

<style scoped>
/* 主项目宽屏双列，实践项目最多三列；窄屏自动降列。标题与内容共享限宽并居中。 */
.project-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
}
.project-panel > .panel-header,
.project-panel__list,
.project-panel__practice {
  width: 100%;
  max-width: var(--focus-content-max);
  margin-inline: auto;
}
.project-panel__list {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
  gap: clamp(1rem, 1.8vw, 1.5rem);
}
.project-panel__practice { margin-top: clamp(2rem, 4vw, 3rem); }
.project-panel__practice-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: clamp(0.75rem, 1.4vw, 1.15rem); }
.project-panel__practice-card { display: flex; min-width: 0; min-height: 16rem; flex-direction: column; gap: 0.8rem; padding: clamp(1.25rem, 1.7vw, 1.5rem); }
.project-panel__practice-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.4rem; }
.project-panel__practice-category { color: var(--accent-primary); font-size: var(--text-xs); font-weight: var(--weight-semibold); }
.project-panel__practice-card h4 { margin: 0; color: var(--text-primary); font-size: var(--text-card-title); font-weight: var(--weight-bold); }
.project-panel__practice-card p { flex: 1; margin: 0; color: var(--text-secondary); font-size: var(--text-base); line-height: 1.55; }
.project-panel__practice-card a { align-self: start; color: var(--accent-primary); font-size: var(--text-sm); font-weight: var(--weight-semibold); text-decoration: none; }
.project-panel__practice-card a:hover { text-decoration: underline; text-underline-offset: 0.2em; }
.project-panel__practice-card a:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 0.2rem; border-radius: var(--radius-control-inner); }
.project-panel__title-skeleton { display: block; width: 10rem; height: 1.1em; }
.project-panel__description-skeleton { display: block; width: min(100%, 40rem); height: 0.8rem; }
.project-panel__description-skeleton--second { display: none; width: 74%; }
.project-panel__practice-category-skeleton { width: 8.4rem; height: 0.7rem; }
.project-panel__practice-status-skeleton { width: 8.5rem; height: 1.45rem; border-radius: var(--radius-pill); }
.project-panel__practice-status-skeleton--nexus { width: 6.2rem; }
.project-panel__practice-status-skeleton--xca { width: 6.8rem; }
.project-panel__practice-card-title-skeleton { width: 10rem; height: 1.25rem; }
.project-panel__practice-description-skeleton { display: grid; gap: 0.8rem; }
.project-panel__practice-description-skeleton span { display: block; width: 100%; height: 0.72rem; }
.project-panel__practice-description-skeleton span:last-child { width: 68%; }
.project-panel__practice-link-skeleton { width: 6rem; height: var(--text-sm); }
@media (max-width: 620px) {
  .project-panel__description-skeleton--second { display: block; }
}
</style>


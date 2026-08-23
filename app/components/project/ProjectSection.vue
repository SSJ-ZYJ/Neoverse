<script setup lang="ts">
import { PROJECTS } from '#shared/constants';

const { t } = useI18n();
const { data: previews } = await useProjectPreviews();
</script>

<template>
  <section id="projects" class="dashboard-panel project-panel" aria-labelledby="projects-title">
    <header class="panel-header">
      <h2 id="projects-title" class="panel-title">{{ t('projects.title') }}</h2>
      <p class="panel-description">{{ t('projects.description') }}</p>
    </header>

    <div class="project-panel__list">
      <ProjectCard
        v-for="project in PROJECTS"
        :key="project.id"
        :project="project"
        :preview="project.id === 'docs' ? previews.docs : previews.blog"
      />
    </div>
  </section>
</template>

<style scoped>
/* 响应式网格：宽屏两列、窄屏自动 1 列，新增项目自动排布。
   标题与内容一起限宽居中，保证左缘对齐（同 Focus 页模式）。 */
.project-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
}
.project-panel > .panel-header,
.project-panel__list {
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
</style>

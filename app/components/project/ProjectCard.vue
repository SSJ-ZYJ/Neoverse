<script setup lang="ts">
import type { ProjectIcon, ProjectId, ProjectTone } from '#shared/constants';
import type { ProjectPreview } from '#shared/types/projects';
import IconLucideBookOpen from '~icons/lucide/book-open';
import IconLucidePenLine from '~icons/lucide/pen-line';
import IconSimpleIconsGithub from '~icons/simple-icons/github';

const props = defineProps<{
  project: {
    id: ProjectId;
    href: string;
    repoHref: string;
    icon: ProjectIcon;
    tone: ProjectTone;
  };
  preview: ProjectPreview;
}>();

const { t, tm, rt, locale } = useI18n();
const translateMessage = rt as (message: unknown) => string;

const copy = computed(() => {
  const prefix = `projects.${props.project.id}`;
  const rawTags: unknown = tm(`${prefix}.tags`);
  return {
    title: t(`${prefix}.title`),
    category: t(`${prefix}.category`),
    description: t(`${prefix}.description`),
    tags: Array.isArray(rawTags) ? rawTags.map((tag: unknown) => translateMessage(tag)) : [],
  };
});

const icon = computed(() => (props.project.icon === 'book-open' ? IconLucideBookOpen : IconLucidePenLine));
const docsPreview = computed(() => (props.preview.kind === 'docs' ? props.preview : null));
const blogPreview = computed(() => (props.preview.kind === 'blog' ? props.preview : null));
const projectHost = computed(() => new URL(props.project.href).hostname);
const docsContent = computed(() => {
  const preview = docsPreview.value;
  if (!preview) return [];
  const preferredLocale = locale.value.startsWith('zh') ? 'zh' : 'en';
  const fallbackLocale = preferredLocale === 'zh' ? 'en' : 'zh';
  return preview.content[preferredLocale].length ? preview.content[preferredLocale] : preview.content[fallbackLocale];
});
const formatArticleDate = (value: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
};
</script>

<template>
  <article class="project-card glass-card">
    <div class="project-card__main">
      <div class="project-card__preview">
        <div class="project-card__preview-frame" :aria-label="t('projects.preview.label', { title: copy.title })">
          <header class="project-card__preview-head">
            <span>{{ t(`projects.preview.${project.id}Title`) }}</span>
            <small>{{ projectHost }}</small>
          </header>

          <template v-if="docsPreview && docsContent.length">
            <ol class="project-card__docs-list">
              <li v-for="item in docsContent" :key="item.title" :class="{ 'is-featured': item.featured }">
                <a :href="item.href" target="_blank" rel="noreferrer">
                  <strong>{{ item.featured ? t('projects.preview.afterwordTitle') : item.title }}</strong>
                  <span>{{ item.featured ? t('projects.preview.afterwordDescription') : item.description }}</span>
                </a>
              </li>
            </ol>
          </template>

          <ol v-else-if="blogPreview?.source === 'rss'" class="project-card__article-list">
            <li v-for="article in blogPreview.articles" :key="`${article.title}:${article.publishedAt ?? ''}`">
              <a :href="article.href" target="_blank" rel="noreferrer">
                <time v-if="article.publishedAt" :datetime="article.publishedAt">
                  {{ formatArticleDate(article.publishedAt) }}
                </time>
                <strong>{{ article.title }}</strong>
              </a>
            </li>
          </ol>

          <p v-else class="project-card__preview-unavailable" role="status">
            {{ t('projects.preview.unavailable') }}
          </p>
        </div>
      </div>
      <a class="project-card__copy" :href="project.href" target="_blank" rel="noreferrer">
          <div class="project-card__title-row">
            <span class="project-card__icon" :class="`project-card__icon--${project.tone}`" aria-hidden="true">
              <component :is="icon" />
            </span>
            <h3>{{ copy.title }}</h3>
          </div>
          <p class="project-card__category">{{ copy.category }}</p>
          <p class="project-card__description">{{ copy.description }}</p>
        </a>
    </div>
    <div class="project-card__footer">
      <div class="project-card__tags">
        <span v-for="tag in copy.tags" :key="tag" class="tech-chip">{{ tag }}</span>
      </div>
      <UiGlassButton
        class="project-card__repo"
        variant="glass"
        size="sm"
        filled-icon
        :href="project.repoHref"
        target="_blank"
        rel="noreferrer"
        :aria-label="t('projects.viewSource')"
        :title="t('projects.viewSource')"
      >
        <template #icon><IconSimpleIconsGithub aria-hidden="true" /></template>
      </UiGlassButton>
    </div>
  </article>
</template>

<style scoped>
/* 竖版卡：图上文下；主体链接负责站点，底部操作行负责仓库。 */
.project-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  transition: border-color var(--motion-fast) var(--motion-ease-standard), box-shadow var(--motion-standard) var(--motion-ease-standard), transform var(--motion-standard) var(--motion-ease-emphasized);
}
.project-card:hover,
.project-card:has(.project-card__repo:hover) { border-color: color-mix(in srgb, var(--border-interactive) 38%, var(--glass-border-hairline)); box-shadow: var(--glass-surface-shadow-hover); transform: translateY(-2px); }
.project-card__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}
.project-card__preview {
  display: grid;
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  place-items: center;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding: clamp(0.55rem, 1vw, 0.85rem);
  background: var(--glass-refraction-fill), var(--glass-card-fill);
}
.project-card__preview-frame {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  flex-direction: column;
  border-radius: var(--radius-control);
  padding: clamp(0.85rem, 1.5vw, 1.15rem);
  background: color-mix(in srgb, var(--background-secondary) 86%, transparent);
  box-shadow: inset 0 0 0 1px var(--glass-border-hairline), inset 0 1px 0 var(--glass-highlight);
}
.project-card__preview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--glass-border-hairline);
  padding-bottom: 0.65rem;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}
.project-card__preview-head small {
  overflow: hidden;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-2xs);
  font-weight: var(--weight-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-card__docs-list,
.project-card__article-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.project-card__docs-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
.project-card__docs-list li {
  display: flex;
  min-height: 0;
  flex: 1;
  border-bottom: 1px solid var(--glass-border-hairline);
}
.project-card__docs-list a,
.project-card__article-list a {
  display: grid;
  min-width: 0;
  flex: 1;
  align-content: center;
  color: inherit;
  text-decoration: none;
}
.project-card__docs-list a { gap: 0.24rem; padding: 0.45rem 0; }
.project-card__docs-list li:last-child { border-bottom: 0; }
.project-card__docs-list li.is-featured {
  position: relative;
  margin-top: 0.12rem;
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 7%, transparent), transparent 72%);
}
.project-card__docs-list li.is-featured:has(a:hover),
.project-card__docs-list li.is-featured:has(a:focus-visible) {
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 14%, transparent), transparent 78%);
}
.project-card__docs-list li.is-featured a { padding-right: 0.5rem; padding-left: 0.7rem; }
.project-card__docs-list li.is-featured::before {
  position: absolute;
  top: 0.45rem;
  bottom: 0.45rem;
  left: 0;
  width: 2px;
  border-radius: var(--radius-pill);
  content: '';
  background: var(--accent-primary);
  opacity: 0.72;
}
.project-card__docs-list strong,
.project-card__docs-list span {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.35;
  -webkit-box-orient: vertical;
}
.project-card__docs-list strong {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  -webkit-line-clamp: 1;
}
.project-card__docs-list li.is-featured strong { color: var(--accent-primary); }
.project-card__docs-list li.is-featured a:hover strong,
.project-card__docs-list li.is-featured a:focus-visible strong {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
.project-card__docs-list span {
  color: var(--text-muted);
  font-size: var(--text-xs);
  -webkit-line-clamp: 1;
}
.project-card__article-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
.project-card__article-list li {
  display: flex;
  min-height: 0;
  flex: 1;
  border-bottom: 1px solid var(--glass-border-hairline);
}
.project-card__article-list a { gap: 0.22rem; padding: 0.45rem 0; }
.project-card__article-list li:last-child { border-bottom: 0; }
.project-card__article-list time {
  color: var(--text-muted);
  font-size: var(--text-2xs);
}
.project-card__article-list strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}
.project-card__article-list li:first-child strong {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  -webkit-line-clamp: 2;
}
.project-card__docs-list a:hover strong,
.project-card__article-list a:hover strong { color: var(--accent-primary); }
.project-card__preview-unavailable {
  display: grid;
  min-height: 0;
  flex: 1;
  place-items: center;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: center;
}
.project-card__copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 0.55rem; padding: clamp(0.9rem, 1.3vw, 1.15rem); color: inherit; text-decoration: none; }
.project-card__title-row { display: flex; align-items: center; gap: 0.55rem; }
.project-card__icon { --project-icon-tone: var(--accent-primary); display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border: 1px solid color-mix(in srgb, var(--project-icon-tone) 24%, var(--glass-border-hairline)); border-radius: var(--radius-control); color: var(--project-icon-tone); background: var(--glass-refraction-fill), color-mix(in srgb, var(--project-icon-tone) 8%, var(--glass-card-fill)); box-shadow: inset 0 1px 0 var(--glass-highlight), 0 0 0.8rem color-mix(in srgb, var(--project-icon-tone) 10%, transparent); }
.project-card__icon--mint { --project-icon-tone: var(--accent-secondary); }
.project-card__icon svg { width: 1.08rem; height: 1.08rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; filter: drop-shadow(0 0 0.3rem color-mix(in srgb, var(--project-icon-tone) 22%, transparent)); }
.project-card__title-row h3 { margin: 0; color: var(--text-primary); font-size: var(--text-card-title-sm); font-weight: var(--weight-bold); letter-spacing: -0.02em; line-height: 1.25; }
.project-card__category { margin: 0; color: var(--accent-primary); font-size: var(--text-sm); font-weight: var(--weight-semibold); }
.project-card__description { display: -webkit-box; overflow: hidden; margin: 0; color: var(--text-secondary); font-size: var(--text-card-description); line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.project-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.65rem clamp(0.9rem, 1.3vw, 1.15rem) clamp(0.9rem, 1.3vw, 1.15rem); border-top: 1px solid var(--glass-border-hairline); }
.project-card__tags { display: flex; min-width: 0; flex-wrap: wrap; gap: 0.3rem; }
@media (prefers-reduced-motion: reduce) { .project-card:hover, .project-card:has(.project-card__repo:hover) { transform: none; } }
</style>

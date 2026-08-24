<script setup lang="ts">
import type { GithubPulse, RecentCommit } from '#shared/types/github';

const props = defineProps<{
  commits: RecentCommit[];
  repositoryPulse: GithubPulse['repositoryPulse'];
  loading: boolean;
}>();
const { t, locale } = useI18n();

const relativeTime = (value: string) => {
  const delta = new Date(value).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' });
  const minutes = Math.round(delta / 60_000);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(delta / 3_600_000);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(delta / 86_400_000), 'day');
};

const repositoryDistribution = computed(() => {
  const total = props.repositoryPulse.totalContributions ?? 0;
  if (props.repositoryPulse.scope === 'unavailable' || total === 0) return [];

  const topRepositories = props.repositoryPulse.repositories.slice(0, 2).map((repository) => ({
    key: repository.repositoryUrl,
    label: repository.repository,
    url: repository.repositoryUrl,
    contributions: repository.contributions,
    ratio: repository.contributions / total,
  }));
  const otherContributions = props.repositoryPulse.repositories
    .slice(3)
    .reduce((sum, repository) => sum + repository.contributions, 0);

  if (otherContributions > 0) {
    topRepositories.push({
      key: 'other',
      label: t('pulse.repositoryPulse.other'),
      url: '',
      contributions: otherContributions,
      ratio: otherContributions / total,
    });
  }

  return topRepositories;
});

const formatNumber = (value: number | null) => (value === null ? '—' : value.toLocaleString(locale.value));
const formatPercentage = (ratio: number) =>
  new Intl.NumberFormat(locale.value, { style: 'percent', maximumFractionDigits: 1 }).format(ratio);
</script>

<template>
  <div class="activity-grid">
    <section class="activity-column glass-card" aria-labelledby="recent-commits-title">
      <h3 id="recent-commits-title">{{ t('pulse.projects.commitsTitle') }}</h3>
      <div v-if="loading" class="activity-list" aria-hidden="true">
        <div v-for="row in 3" :key="row" class="activity-row activity-row--skeleton">
          <span class="skeleton-surface activity-row__dot" />
          <span class="activity-row__copy">
            <BaseSkeleton variant="text" width="85%" />
            <BaseSkeleton variant="text" width="48%" />
          </span>
        </div>
      </div>
      <ul v-else-if="commits.length" class="activity-list">
        <li v-for="commit in commits.slice(0, 3)" :key="commit.id">
          <a
            class="activity-row"
            :href="commit.url"
            target="_blank"
            rel="noreferrer"
            :aria-label="t('pulse.projects.viewCommit', { message: commit.message })"
          >
            <span class="activity-row__dot activity-row__dot--commit" aria-hidden="true" />
            <span class="activity-row__copy">
              <strong>{{ commit.message }}</strong>
              <small class="activity-row__meta">
                <span>{{ commit.repository }}</span>
                <time :datetime="commit.date">{{ relativeTime(commit.date) }}</time>
              </small>
            </span>
            <span class="activity-row__external" aria-hidden="true">↗</span>
          </a>
        </li>
      </ul>
      <p v-else class="activity-empty">{{ t('pulse.projects.emptyCommits') }}</p>
    </section>

    <section class="activity-column glass-card" aria-labelledby="repository-pulse-title">
      <header class="repository-pulse__header">
        <h3 id="repository-pulse-title">{{ t('pulse.repositoryPulse.title') }}</h3>
        <span>{{ t('pulse.repositoryPulse.scope') }}</span>
      </header>

      <template v-if="loading">
        <!-- 静态文案直接展示，只为未知数值占位，避免满屏碎块。 -->
        <dl class="repository-metrics" aria-hidden="true">
          <div>
            <dt>{{ t('pulse.repositoryPulse.activeRepositories') }}</dt>
            <dd><BaseSkeleton variant="title" width="3.5rem" /></dd>
          </div>
          <div>
            <dt>{{ t('pulse.repositoryPulse.commitContributions') }}</dt>
            <dd><BaseSkeleton variant="title" width="3.5rem" /></dd>
          </div>
        </dl>
        <div class="repository-distribution" aria-hidden="true">
          <h4>{{ t('pulse.repositoryPulse.mostActive') }}</h4>
          <ul>
            <li v-for="(row, index) in 3" :key="index">
              <BaseSkeleton variant="text" :width="`${[58, 34, 44][index]}%`" />
              <span class="repository-distribution__track repository-distribution__track--skeleton">
                <i :style="{ width: `${String([88, 62, 74][index])}%` }" />
              </span>
            </li>
          </ul>
        </div>
      </template>

      <template v-else-if="repositoryPulse.scope !== 'unavailable'">
        <dl class="repository-metrics">
          <div>
            <dt>{{ t('pulse.repositoryPulse.activeRepositories') }}</dt>
            <dd>{{ formatNumber(repositoryPulse.activeRepositories) }}</dd>
          </div>
          <div>
            <dt>{{ t('pulse.repositoryPulse.commitContributions') }}</dt>
            <dd>{{ formatNumber(repositoryPulse.totalContributions) }}</dd>
          </div>
        </dl>

        <div class="repository-distribution">
          <h4>{{ t('pulse.repositoryPulse.mostActive') }}</h4>
          <ul v-if="repositoryDistribution.length">
            <li v-for="repository in repositoryDistribution" :key="repository.key">
              <div class="repository-distribution__label">
                <a
                  v-if="repository.url"
                  :href="repository.url"
                  target="_blank"
                  rel="noreferrer"
                >{{ repository.label }}</a>
                <span v-else>{{ repository.label }}</span>
                <span>{{ formatPercentage(repository.ratio) }}</span>
              </div>
              <span class="repository-distribution__track" aria-hidden="true">
                <i :style="{ width: `${String(repository.ratio * 100)}%` }" />
              </span>
            </li>
          </ul>
          <p v-else class="repository-distribution__empty">{{ t('pulse.repositoryPulse.empty') }}</p>
        </div>
      </template>

      <p v-else class="activity-empty repository-pulse__unavailable">
        {{ t('pulse.repositoryPulse.unavailable') }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.activity-grid {
  display: grid;
  flex: none;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.7rem, 1.4vw, 1.1rem);
}
.activity-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: clamp(0.85rem, 1.6vw, 1.35rem);
}
.activity-column h3 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-size: var(--text-card-title);
  font-weight: var(--weight-bold);
  letter-spacing: -0.03em;
}
.activity-list {
  display: grid;
  align-content: start;
  margin: 0;
  padding: 0;
  list-style: none;
}
.activity-row {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.72rem;
  border-top: 1px solid var(--glass-border-hairline);
  padding: 0.62rem 0;
  color: inherit;
  text-decoration: none;
}
.activity-list li:first-child .activity-row,
.activity-row--skeleton:first-child {
  border-top: 0;
}
.activity-row__dot {
  width: 0.58rem;
  height: 0.58rem;
  margin-top: 0.32rem;
  border-radius: 50%;
  background: var(--accent-primary);
  box-shadow: 0 0 0 0.26rem color-mix(in srgb, var(--accent-primary) 10%, transparent);
}
.activity-row__copy {
  display: grid;
  min-width: 0;
  gap: 0.28rem;
}
.activity-row strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  line-height: 1.35;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.activity-row__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.45rem;
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--text-xs);
  line-height: 1.35;
  white-space: nowrap;
}
.activity-row__meta span {
  overflow: hidden;
  border-radius: var(--radius-sm);
  padding: 0.12rem 0.34rem;
  color: var(--text-secondary);
  text-overflow: ellipsis;
  background: var(--surface-subtle);
}
.activity-row__meta time {
  flex: none;
}
.activity-row__external {
  margin-top: 0.04rem;
  color: var(--text-muted);
  font-size: var(--text-md);
  transition: color var(--motion-fast) var(--motion-ease-standard),
    transform var(--motion-fast) var(--motion-ease-standard);
}
.activity-row:hover strong,
.activity-row:hover .activity-row__external {
  color: var(--accent-primary);
}
.activity-row:hover .activity-row__external {
  transform: translate(0.08rem, -0.08rem);
}
.activity-row:focus-visible {
  border-radius: var(--radius-control);
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
.activity-row--skeleton {
  min-height: 3.98rem;
  grid-template-columns: auto minmax(0, 1fr);
}
.activity-row--skeleton .activity-row__dot {
  box-shadow: none;
}
.activity-empty {
  display: grid;
  min-height: 8rem;
  flex: 1;
  place-items: center;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-md);
  text-align: center;
}
.repository-pulse__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}
.repository-pulse__header h3 {
  margin-bottom: 0;
}
.repository-pulse__header > span {
  flex: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.repository-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0.72rem 0 0;
  border-top: 1px solid var(--glass-border-hairline);
  border-bottom: 1px solid var(--glass-border-hairline);
}
.repository-metrics div {
  min-width: 0;
  padding: 0.72rem 0;
}
.repository-metrics div + div {
  border-left: 1px solid var(--glass-border-hairline);
  padding-left: 1rem;
}
.repository-metrics dt {
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.repository-metrics dd {
  margin: 0.25rem 0 0;
  color: var(--text-primary);
  font-size: var(--text-display-sm);
  font-weight: var(--weight-display);
  letter-spacing: -0.05em;
  line-height: 1;
}
.repository-metrics dt :deep(.base-skeleton) { height: calc(var(--text-sm) * 1.55); }
.repository-metrics dd :deep(.base-skeleton) { height: var(--text-display-sm); }
.repository-distribution {
  display: grid;
  align-content: start;
  gap: 0.58rem;
  padding-top: 0.76rem;
}
.repository-distribution h4 {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  letter-spacing: 0.01em;
}
.repository-distribution ul {
  display: grid;
  gap: 0.56rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.repository-distribution li {
  display: grid;
  min-width: 0;
  gap: 0.28rem;
}
.repository-distribution__label {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--text-muted);
  font-size: var(--text-xs);
}
.repository-distribution__label a,
.repository-distribution__label > span:first-child {
  overflow: hidden;
  color: var(--text-secondary);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.repository-distribution__label a:hover {
  color: var(--accent-primary);
}
.repository-distribution__track {
  height: 0.32rem;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--surface-subtle);
}
.repository-distribution__track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
}
.repository-distribution__empty {
  display: grid;
  min-height: 5rem;
  place-items: center;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-md);
  text-align: center;
}
.repository-distribution__track--skeleton i { width: 100%; background: var(--skeleton-fill); }
.repository-pulse__unavailable {
  min-height: 11rem;
}
@media (max-width: 900px) {
  .activity-row--skeleton:nth-child(even) { min-height: 5.15rem; }
}
@media (max-width: 720px) {
  .activity-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 380px) {
  .activity-row--skeleton { min-height: 5.15rem; }
}
@media (max-width: 380px) {
  .repository-pulse__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.15rem;
  }
  .repository-metrics div + div {
    padding-left: 0.65rem;
  }
}
</style>

import { expect, test } from 'bun:test';
import { loadPublicRepositoryPulse, type PublicCommitSearchResponse } from '../server/utils/github-repository-pulse';

const now = new Date('2026-10-06T12:00:00Z');
const commit = (sha: string, repository = 'owner/project', date = '2026-10-05T12:00:00Z') => ({
  sha,
  commit: { author: { date } },
  repository: {
    name: repository.split('/')[1] ?? '',
    full_name: repository,
    html_url: `https://github.com/${repository}`,
    private: false,
  },
});
const response = (items: PublicCommitSearchResponse['items'], total = items.length): PublicCommitSearchResponse => ({
  items,
  total_count: total,
  incomplete_results: false,
});

test('public fallback counts unique commits per repository inside the rolling 30-day window', async () => {
  const items = [
    commit('a'),
    commit('a'),
    commit('b'),
    commit('c', 'other/project'),
    commit('old', 'owner/project', '2026-09-06T11:00:00Z'),
  ];
  const result = await loadPublicRepositoryPulse(async () => response(items), 'owner', now);
  expect(result.scope).toBe('search');
  expect(result.activeRepositories).toBe(2);
  expect(result.totalContributions).toBe(3);
  expect(result.repositories.map((repository) => repository.contributions)).toEqual([2, 1]);
});

test('all pages are required before reporting totals', async () => {
  const pages: number[] = [];
  const result = await loadPublicRepositoryPulse(
    async (_query, page) => {
      pages.push(page);
      return response(
        page === 1 ? Array.from({ length: 100 }, (_, index) => commit(String(index))) : [commit('100')],
        101,
      );
    },
    'owner',
    now,
  );
  expect(pages).toEqual([1, 2]);
  expect(result.totalContributions).toBe(101);
});

test('empty search is a verified empty state', async () => {
  expect((await loadPublicRepositoryPulse(async () => response([]), 'owner', now)).totalContributions).toBe(0);
});

test('incomplete and truncated searches fail instead of fabricating complete totals', async () => {
  await expect(
    loadPublicRepositoryPulse(async () => ({ ...response([]), incomplete_results: true }), 'owner', now),
  ).rejects.toThrow('incomplete');
  await expect(loadPublicRepositoryPulse(async () => response([], 1001), 'owner', now)).rejects.toThrow('incomplete');
  await expect(loadPublicRepositoryPulse(async () => response([commit('a')], 2), 'owner', now)).rejects.toThrow(
    'all results',
  );
});

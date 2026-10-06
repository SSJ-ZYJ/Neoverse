import type { GithubPulse, RepositoryActivity } from '../../shared/types/github';

export interface PublicCommitSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    sha: string;
    commit: { author: { date: string } };
    repository: { name: string; full_name: string; html_url: string; private: boolean };
  }>;
}

type FetchPage = (query: string, page: number) => Promise<PublicCommitSearchResponse>;

// Anonymous search covers public default-branch commits. Never present truncated
// search results as complete repository totals.
export async function loadPublicRepositoryPulse(
  fetchPage: FetchPage,
  login: string,
  now = new Date(),
): Promise<GithubPulse['repositoryPulse']> {
  const from = new Date(now.getTime() - 30 * 86_400_000);
  const dateKey = (date: Date) => date.toISOString().slice(0, 10);
  const query = `author:${login} author-date:${dateKey(from)}..${dateKey(now)}`;
  const repositories = new Map<string, RepositoryActivity>();
  const seen = new Set<string>();
  let expectedTotal = 0;
  let received = 0;

  for (let page = 1; page <= 10; page += 1) {
    const result = await fetchPage(query, page);
    if (page === 1) expectedTotal = result.total_count;
    if (result.incomplete_results || expectedTotal > 1000 || result.total_count !== expectedTotal) {
      throw new Error('Public commit search is incomplete or changed during pagination.');
    }
    received += result.items.length;

    for (const item of result.items) {
      const authoredAt = Date.parse(item.commit.author.date);
      if (!Number.isFinite(authoredAt)) throw new Error('Public commit search returned an invalid author date.');
      if (authoredAt < from.getTime() || authoredAt > now.getTime() || item.repository.private) continue;
      const key = `${item.repository.full_name}:${item.sha}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const repository = repositories.get(item.repository.full_name) ?? {
        repository: item.repository.name,
        repositoryUrl: item.repository.html_url,
        contributions: 0,
      };
      repository.contributions += 1;
      repositories.set(item.repository.full_name, repository);
    }

    if (received >= expectedTotal) {
      const distribution = [...repositories.values()].sort((a, b) => b.contributions - a.contributions);
      return {
        activeRepositories: distribution.length,
        totalContributions: distribution.reduce((total, repository) => total + repository.contributions, 0),
        repositories: distribution,
        scope: 'search',
        from: dateKey(from),
        to: dateKey(now),
      };
    }
    if (result.items.length < 100) break;
  }

  throw new Error('Public commit search did not return all results.');
}

import { createEmptyPulse } from '#shared/constants';
import type { ContributionDay, GithubPulse, RecentCommit, RepositoryActivity } from '#shared/types/github';

const GITHUB_USER = 'SSJ-ZYJ';
const GITHUB_API = 'https://api.github.com';
const RECENT_BRANCH_LIMIT = 4;
const RECENT_COMMIT_LIMIT = 4;
const REPOSITORY_WINDOW_DAYS = 30;

interface GithubEventResponse {
  type: string;
  repo?: { name: string };
  created_at: string;
  payload?: {
    ref?: string;
    head?: string;
  };
}

interface RecentBranch {
  owner: string;
  repository: string;
  repositoryPath: string;
  ref: string;
  head: string;
}

interface GithubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { date?: string | null };
    committer?: { date?: string | null };
  };
}

interface GithubCommitNode {
  oid: string;
  messageHeadline: string;
  committedDate: string;
  url: string;
}

interface RepositoryHistoryResponse {
  object?: {
    history?: { nodes: GithubCommitNode[] };
  } | null;
}

interface ContributionCalendarResponse {
  totalContributions: number;
  weeks: Array<{
    contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: string }>;
  }>;
}

interface RepositoryContributionResponse {
  repository: {
    name: string;
    url: string;
    isPrivate: boolean;
  };
  contributions: { totalCount: number };
}

interface ContributionsGraphqlResponse {
  data?: Record<string, unknown> & {
    user?: {
      year?: {
        contributionCalendar?: ContributionCalendarResponse;
      };
      recent?: {
        commitContributionsByRepository?: RepositoryContributionResponse[];
      };
    };
  };
}

interface GithubContributionResult {
  contributions: GithubPulse['contributions'] | null;
  repositoryPulse: GithubPulse['repositoryPulse'];
  recentCommits: RecentCommit[];
}

const apiHeaders = (token?: string) => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'shenshijun-space',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const fetchGithub = <T>(path: string, token?: string) =>
  $fetch<T>(`${GITHUB_API}${path}`, {
    headers: apiHeaders(token),
    timeout: 7000,
  });

const levelForCount = (count: number): ContributionDay['level'] => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
};

const levelFromGithub = (level: string, count: number): ContributionDay['level'] => {
  if (level === 'NONE') return 0;
  if (level === 'FIRST_QUARTILE') return 1;
  if (level === 'SECOND_QUARTILE') return 2;
  if (level === 'THIRD_QUARTILE') return 3;
  if (level === 'FOURTH_QUARTILE') return 4;
  return levelForCount(count);
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const calculateLongestStreak = (days: ContributionDay[]) => {
  let longest = 0;
  let current = 0;
  let previousDate: Date | undefined;
  for (const day of [...days].sort((first, second) => first.date.localeCompare(second.date))) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const consecutive = !previousDate || date.getTime() - previousDate.getTime() === 86_400_000;
    current = day.count > 0 ? (consecutive ? current + 1 : 1) : 0;
    longest = Math.max(longest, current);
    previousDate = date;
  }
  return longest;
};

const buildRecentLandscape = (events: GithubEventResponse[], now = new Date()): GithubPulse['contributions'] => {
  if (!events.length) {
    return { total: 0, longestStreak: 0, days: [], scope: 'unavailable', from: null, to: null };
  }

  const counts = new Map<string, number>();
  for (const event of events) {
    const date = event.created_at?.slice(0, 10);
    if (!date) continue;
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const days: ContributionDay[] = [];
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 83));
  for (let index = 0; index < 84; index += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = toDateKey(date);
    const count = counts.get(key) ?? 0;
    days.push({ date: key, count, level: levelForCount(count) });
  }

  return {
    total: days.reduce((sum, day) => sum + day.count, 0),
    longestStreak: calculateLongestStreak(days),
    days,
    scope: 'recent',
    from: days[0]?.date ?? null,
    to: days.at(-1)?.date ?? null,
  };
};

const getRecentBranches = (events: GithubEventResponse[]): RecentBranch[] => {
  const branches: RecentBranch[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const repositoryPath = event.repo?.name;
    const ref = event.payload?.ref;
    const head = event.payload?.head;
    if (event.type !== 'PushEvent' || !repositoryPath || !ref?.startsWith('refs/heads/') || !head) continue;
    const [owner, repository] = repositoryPath.split('/');
    if (!owner || !repository) continue;
    const key = `${repositoryPath}:${ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    branches.push({ owner, repository, repositoryPath, ref, head });
    if (branches.length === RECENT_BRANCH_LIMIT) break;
  }

  return branches;
};

const mergeRecentCommits = (commits: RecentCommit[]) => {
  const unique = new Map<string, RecentCommit>();
  for (const commit of commits) {
    if (!unique.has(commit.id)) unique.set(commit.id, commit);
  }
  return [...unique.values()]
    .sort((first, second) => (Date.parse(second.date) || 0) - (Date.parse(first.date) || 0))
    .slice(0, RECENT_COMMIT_LIMIT);
};

const fetchRecentCommitsFromBranches = async (branches: RecentBranch[], token?: string): Promise<RecentCommit[]> => {
  const results = await Promise.allSettled(
    branches.map((branch) =>
      fetchGithub<GithubCommitResponse[]>(
        `/repos/${branch.repositoryPath}/commits?sha=${encodeURIComponent(branch.head)}&per_page=${String(RECENT_COMMIT_LIMIT)}`,
        token,
      ),
    ),
  );
  const commits: RecentCommit[] = [];

  results.forEach((result, index) => {
    const branch = branches[index];
    if (!branch || result.status !== 'fulfilled') return;
    for (const commit of result.value) {
      const date = commit.commit.committer?.date ?? commit.commit.author?.date;
      if (!date) continue;
      commits.push({
        id: `${branch.repositoryPath}:${commit.sha}`,
        message: commit.commit.message.split('\n')[0]?.trim() || commit.sha.slice(0, 7),
        repository: branch.repository,
        repositoryUrl: `https://github.com/${branch.repositoryPath}`,
        url: commit.html_url,
        date,
      });
    }
  });

  return mergeRecentCommits(commits);
};

const queryGithubContributions = async (
  token: string,
  branches: RecentBranch[],
): Promise<GithubContributionResult | null> => {
  const to = new Date();
  const yearFrom = new Date(to);
  yearFrom.setUTCFullYear(yearFrom.getUTCFullYear() - 1);
  yearFrom.setUTCDate(yearFrom.getUTCDate() + 1);
  const repositoryFrom = new Date(to.getTime() - REPOSITORY_WINDOW_DAYS * 86_400_000);
  const branchVariableDefinitions = branches
    .map(
      (_, index) =>
        `,$branchOwner${String(index)}:String!,$branchName${String(index)}:String!,$branchHead${String(index)}:String!`,
    )
    .join('');
  const branchSelections = branches
    .map(
      (_, index) =>
        `branch${String(index)}:repository(owner:$branchOwner${String(index)},name:$branchName${String(index)}){object(expression:$branchHead${String(index)}){... on Commit{history(first:${String(RECENT_COMMIT_LIMIT)}){nodes{oid,messageHeadline,committedDate,url}}}}}`,
    )
    .join('');
  const query = `query($login:String!,$yearFrom:DateTime!,$repositoryFrom:DateTime!,$to:DateTime!${branchVariableDefinitions}){user(login:$login){year:contributionsCollection(from:$yearFrom,to:$to){contributionCalendar{totalContributions,weeks{contributionDays{date,contributionCount,contributionLevel}}}}recent:contributionsCollection(from:$repositoryFrom,to:$to){commitContributionsByRepository(maxRepositories:100){repository{name,url,isPrivate},contributions(first:100){totalCount}}}}${branchSelections}}`;
  const variables: Record<string, string> = {
    login: GITHUB_USER,
    yearFrom: yearFrom.toISOString(),
    repositoryFrom: repositoryFrom.toISOString(),
    to: to.toISOString(),
  };
  branches.forEach((branch, index) => {
    variables[`branchOwner${String(index)}`] = branch.owner;
    variables[`branchName${String(index)}`] = branch.repository;
    variables[`branchHead${String(index)}`] = branch.head;
  });
  const response = await $fetch<ContributionsGraphqlResponse>('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...apiHeaders(token), 'Content-Type': 'application/json' },
    body: { query, variables },
    timeout: 7000,
  });
  const user = response.data?.user;
  if (!user) return null;

  const calendar = user.year?.contributionCalendar;
  const days = calendar
    ? calendar.weeks
        .flatMap((week) => week.contributionDays)
        .map((day) => ({
          date: day.date,
          count: day.contributionCount,
          level: levelFromGithub(day.contributionLevel, day.contributionCount),
        }))
    : [];
  const contributions: GithubPulse['contributions'] | null = calendar
    ? {
        total: calendar.totalContributions,
        longestStreak: calculateLongestStreak(days),
        days,
        scope: 'year',
        from: days[0]?.date ?? toDateKey(yearFrom),
        to: days.at(-1)?.date ?? toDateKey(to),
      }
    : null;

  const repositoryGroups = user.recent?.commitContributionsByRepository;
  const repositories: RepositoryActivity[] = Array.isArray(repositoryGroups)
    ? repositoryGroups
        .filter((group) => !group.repository.isPrivate && group.contributions.totalCount > 0)
        .map((group) => ({
          repository: group.repository.name,
          repositoryUrl: group.repository.url,
          contributions: group.contributions.totalCount,
        }))
        .sort((first, second) => second.contributions - first.contributions)
    : [];
  const repositoryPulse: GithubPulse['repositoryPulse'] = Array.isArray(repositoryGroups)
    ? {
        activeRepositories: repositories.length,
        totalContributions: repositories.reduce((sum, repository) => sum + repository.contributions, 0),
        repositories,
        scope: 'month',
        from: toDateKey(repositoryFrom),
        to: toDateKey(to),
      }
    : createEmptyPulse().repositoryPulse;

  const branchCommits = branches.flatMap((branch, index) => {
    const repository = response.data?.[`branch${String(index)}`] as RepositoryHistoryResponse | undefined;
    return (repository?.object?.history?.nodes ?? []).map((commit) => ({
      id: `${branch.repositoryPath}:${commit.oid}`,
      message: commit.messageHeadline.trim() || commit.oid.slice(0, 7),
      repository: branch.repository,
      repositoryUrl: `https://github.com/${branch.repositoryPath}`,
      url: commit.url,
      date: commit.committedDate,
    }));
  });

  return { contributions, repositoryPulse, recentCommits: mergeRecentCommits(branchCommits) };
};

export default defineCachedEventHandler(
  async (): Promise<GithubPulse> => {
    const empty = createEmptyPulse();
    const token = useRuntimeConfig().githubToken || undefined;

    try {
      let events: GithubEventResponse[] = [];
      try {
        events = await fetchGithub<GithubEventResponse[]>(`/users/${GITHUB_USER}/events/public?per_page=100`, token);
      } catch {
        events = [];
      }
      const branches = getRecentBranches(events);
      let githubContributions: GithubContributionResult | null = null;
      if (token) {
        try {
          githubContributions = await queryGithubContributions(token, branches);
        } catch {
          githubContributions = null;
        }
      }
      const contributions = githubContributions?.contributions ?? buildRecentLandscape(events);
      const recentCommits = githubContributions?.recentCommits.length
        ? githubContributions.recentCommits
        : await fetchRecentCommitsFromBranches(branches, token);
      const repositoryPulse = githubContributions?.repositoryPulse ?? empty.repositoryPulse;

      if (contributions.scope === 'unavailable' && !recentCommits.length && repositoryPulse.scope === 'unavailable') {
        return empty;
      }

      return {
        contributions,
        recentCommits,
        repositoryPulse,
        source: 'github',
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return empty;
    }
  },
  {
    getKey: () => (useRuntimeConfig().githubToken ? 'pulse-repository-v3-token' : 'pulse-repository-v3-public'),
    maxAge: 900,
    swr: true,
  },
);

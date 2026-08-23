export type PulseSource = 'github' | 'unavailable';
export type ContributionScope = 'year' | 'recent' | 'unavailable';
export type RepositoryPulseScope = 'month' | 'unavailable';

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface RecentCommit {
  id: string;
  message: string;
  repository: string;
  repositoryUrl: string;
  url: string;
  date: string;
}

export interface RepositoryActivity {
  repository: string;
  repositoryUrl: string;
  contributions: number;
}

export interface GithubPulse {
  contributions: {
    total: number;
    longestStreak: number;
    days: ContributionDay[];
    scope: ContributionScope;
    from: string | null;
    to: string | null;
  };
  recentCommits: RecentCommit[];
  repositoryPulse: {
    activeRepositories: number | null;
    totalContributions: number | null;
    repositories: RepositoryActivity[];
    scope: RepositoryPulseScope;
    from: string | null;
    to: string | null;
  };
  source: PulseSource;
  updatedAt: string | null;
}

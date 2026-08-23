import { createEmptyPulse } from '#shared/constants';
import type { GithubPulse } from '#shared/types/github';

export function useGithubPulse() {
  return useFetch<GithubPulse>('/api/github/pulse', {
    key: 'neoverse-github-pulse',
    server: true,
    default: () => createEmptyPulse(),
  });
}

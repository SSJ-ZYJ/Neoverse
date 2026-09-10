import { createEmptyPulse } from '#shared/constants';
import type { GithubPulse } from '#shared/types/github';

export function useGithubPulse() {
  return useFetch<GithubPulse>('/api/github/pulse', {
    key: 'neoverse-github-pulse',
    server: true,
    default: () => createEmptyPulse(),
    // 默认行为会把 payload 里的数据永久缓存在内存中：dock 切回 pulse 时
    // 命中缓存、永不重新请求，页面一直显示上一次会话的旧数据。
    // 改为仅在水合期间复用 SSR payload；客户端导航一律重新请求。
    getCachedData: (key, nuxtApp) => (nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined),
  });
}

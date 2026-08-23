import type { GithubPulse } from './types/github';
import type { ProjectPreviews } from './types/projects';

export const SITE = {
  name: 'Neoverse',
  origin: 'https://shenshijun.space',
  github: 'https://github.com/SSJ-ZYJ',
  docs: 'https://docs.shenshijun.space',
  docsRepository: 'https://github.com/SSJ-ZYJ/Neoverse-Doc',
  blog: 'https://blog.shenshijun.space',
  blogRepository: 'https://github.com/SSJ-ZYJ/SSJ-Blog',
  bilibili: 'https://space.bilibili.com/293619559/',
  linuxdo: 'https://linux.do/u/ssj-zyj/',
  email: 'mailto:me@shenshijun.space',
  avatar: 'https://assets.shenshijun.space/avatar.png',
  filingNumber: '辽ICP备2025069492号-1',
  filingUrl: 'https://beian.miit.gov.cn/#/Integrated/index/',
} as const;

export const HOME_LINKS = [
  {
    id: 'github',
    href: SITE.github,
    labelKey: 'common.github',
    external: true,
    skeletonWidth: '6.1rem',
    icon: 'simple-icons:github',
    filledIcon: true,
  },
  {
    id: 'docs',
    href: SITE.docs,
    labelKey: 'common.docs',
    external: true,
    skeletonWidth: '5.4rem',
    icon: 'lucide:file-text',
    filledIcon: false,
  },
  {
    id: 'blog',
    href: SITE.blog,
    labelKey: 'common.blog',
    external: true,
    skeletonWidth: '5.2rem',
    icon: 'lucide:pen-line',
    filledIcon: false,
  },
  {
    id: 'bilibili',
    href: SITE.bilibili,
    labelKey: 'common.bilibili',
    external: true,
    skeletonWidth: '6.4rem',
    icon: 'simple-icons:bilibili',
    filledIcon: true,
  },
  {
    id: 'linuxdo',
    href: SITE.linuxdo,
    labelKey: 'common.linuxdo',
    external: true,
    skeletonWidth: '6.9rem',
    icon: 'lucide:terminal',
    filledIcon: false,
  },
  {
    id: 'email',
    href: SITE.email,
    labelKey: 'common.email',
    external: false,
    skeletonWidth: '5.9rem',
    icon: 'lucide:mail',
    filledIcon: false,
  },
] as const;

export const HOME_LINK_MOTION = {
  initialDelayMs: 560,
  staggerMs: 120,
  entryDurationMs: 900,
  statusGapMs: 60,
  maxStaggeredLinks: 8,
} as const;

export function getHomeLinkEntryDelay(index: number) {
  const finalSlot = HOME_LINK_MOTION.maxStaggeredLinks - 1;
  const slot = Math.min(Math.max(index, 0), finalSlot);
  return HOME_LINK_MOTION.initialDelayMs + slot * HOME_LINK_MOTION.staggerMs;
}

export function getHomeStatusEntryDelay(linkCount: number) {
  if (linkCount <= 0) return HOME_LINK_MOTION.initialDelayMs;
  return getHomeLinkEntryDelay(linkCount - 1) + HOME_LINK_MOTION.entryDurationMs + HOME_LINK_MOTION.statusGapMs;
}

export type ViewId = 'home' | 'projects' | 'focus' | 'pulse';
export const VIEW_IDS: ViewId[] = ['home', 'projects', 'focus', 'pulse'];
export const NAV_ITEMS = [
  { id: 'home', path: '/' },
  { id: 'projects', path: '/projects' },
  { id: 'focus', path: '/focus' },
  { id: 'pulse', path: '/pulse' },
] as const;

/* 统一发展阶段语义：探索 → 学习 → 构建 → 应用。 */
export type FocusStatus = 'exploring' | 'learning' | 'building' | 'applying';

export const FOCUS_DOMAINS = [
  { id: 'foundations', status: 'learning', tone: 'mint' },
  { id: 'open-source', status: 'building', tone: 'violet' },
  { id: 'agentic-development', status: 'exploring', tone: 'ice' },
] as const;

export type ProjectTone = 'ice' | 'mint';
export type ProjectIcon = 'book-open' | 'pen-line';

export const PROJECTS = [
  {
    id: 'docs',
    href: SITE.docs,
    repoHref: SITE.docsRepository,
    icon: 'book-open',
    tone: 'ice',
  },
  {
    id: 'blog',
    href: SITE.blog,
    repoHref: SITE.blogRepository,
    icon: 'pen-line',
    tone: 'mint',
  },
] as const;

export type ProjectId = (typeof PROJECTS)[number]['id'];

export function createEmptyProjectPreviews(): ProjectPreviews {
  return {
    docs: {
      kind: 'docs',
      source: 'unavailable',
      content: {
        en: [
          {
            title: 'What It Means to Learn',
            description: 'The afterword of the Neoverse-Docs project',
            href: `${SITE.docs}/en/docs/about`,
            featured: true,
          },
        ],
        zh: [
          {
            title: '后记',
            description: '何以为学——Neoverse-Docs 项目的后记',
            href: `${SITE.docs}/zh/docs/about`,
            featured: true,
          },
        ],
      },
    },
    blog: { kind: 'blog', source: 'unavailable', articles: [] },
    updatedAt: null,
  };
}

export function createEmptyPulse(): GithubPulse {
  return {
    contributions: {
      total: 0,
      longestStreak: 0,
      days: [],
      scope: 'unavailable',
      from: null,
      to: null,
    },
    recentCommits: [],
    repositoryPulse: {
      activeRepositories: null,
      totalContributions: null,
      repositories: [],
      scope: 'unavailable',
      from: null,
      to: null,
    },
    source: 'unavailable',
    updatedAt: null,
  };
}

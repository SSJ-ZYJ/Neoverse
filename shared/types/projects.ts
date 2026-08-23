export type ProjectPreviewSource = 'sitemap' | 'rss' | 'unavailable';

export type DocsPreviewLocale = 'en' | 'zh';

export interface DocsContentPreview {
  title: string;
  description: string;
  href: string;
  featured: boolean;
}

export interface DocsProjectPreview {
  kind: 'docs';
  source: Extract<ProjectPreviewSource, 'sitemap' | 'unavailable'>;
  content: Record<DocsPreviewLocale, DocsContentPreview[]>;
}

export interface BlogArticlePreview {
  title: string;
  href: string;
  publishedAt: string | null;
}

export interface BlogProjectPreview {
  kind: 'blog';
  source: Extract<ProjectPreviewSource, 'rss' | 'unavailable'>;
  articles: BlogArticlePreview[];
}

export type ProjectPreview = DocsProjectPreview | BlogProjectPreview;

export interface ProjectPreviews {
  docs: DocsProjectPreview;
  blog: BlogProjectPreview;
  updatedAt: string | null;
}

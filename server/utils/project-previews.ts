import type { BlogProjectPreview, DocsContentPreview, DocsPreviewLocale } from '#shared/types/projects';

const decodeXml = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .trim();

const extractTag = (source: string, tag: string) => {
  const match = source.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1] ? decodeXml(match[1]) : '';
};

export const parseDocsChapterUrls = (xml: string): Record<DocsPreviewLocale, string[]> => {
  const chapters: Record<DocsPreviewLocale, string[]> = { en: [], zh: [] };
  const chapterNames = new Set<string>();
  let docsOrigin = '';
  const locations = xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>|<xhtml:link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi);
  for (const match of locations) {
    const rawLocation = decodeXml(match[1] ?? match[2] ?? '');
    if (!rawLocation) continue;

    try {
      const location = new URL(rawLocation);
      const chapterMatch = location.pathname.match(/^\/(en|zh)\/docs\/(ch\d+)(?:\/|$)/);
      const locale = chapterMatch?.[1] as DocsPreviewLocale | undefined;
      const chapter = chapterMatch?.[2];
      if (!locale || !chapter) continue;
      docsOrigin ||= location.origin;
      chapterNames.add(chapter);
      const chapterUrl = new URL(`/${locale}/docs/${chapter}`, location.origin).href;
      if (!chapters[locale].includes(chapterUrl)) chapters[locale].push(chapterUrl);
    } catch {
      // Ignore malformed external entries rather than invalidating the whole feed.
    }
  }
  if (docsOrigin) {
    for (const chapter of chapterNames) {
      for (const locale of ['en', 'zh'] as const) {
        const chapterUrl = new URL(`/${locale}/docs/${chapter}`, docsOrigin).href;
        if (!chapters[locale].includes(chapterUrl)) chapters[locale].push(chapterUrl);
      }
    }
  }
  chapters.en.sort();
  chapters.zh.sort();
  return chapters;
};

const extractMeta = (html: string, key: string) => {
  for (const match of html.matchAll(/<meta\s+[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/\b(?:name|property)=["']([^"']+)["']/i)?.[1];
    if (name !== key) continue;
    const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
    if (content) return decodeXml(content);
  }
  return '';
};

export const parseDocsPage = (html: string, href: string): DocsContentPreview | null => {
  const title = extractMeta(html, 'og:title') || extractTag(html, 'title').replace(/\s+-\s+Neoverse-Docs$/, '');
  const description = extractMeta(html, 'og:description') || extractMeta(html, 'description');
  return title ? { title, description, href, featured: false } : null;
};

const normalizeExternalUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

export const parseBlogFeed = (xml: string): BlogProjectPreview => {
  const articles = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .slice(0, 3)
    .map((match) => {
      const item = match[1] ?? '';
      const title = extractTag(item, 'title');
      const href = normalizeExternalUrl(extractTag(item, 'link'));
      const publishedDate = extractTag(item, 'pubDate');
      const timestamp = Date.parse(publishedDate);
      if (!title || !href) return null;
      return {
        title,
        href,
        publishedAt: Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString(),
      };
    })
    .filter((article): article is BlogProjectPreview['articles'][number] => article !== null);

  return articles.length
    ? { kind: 'blog', source: 'rss', articles }
    : { kind: 'blog', source: 'unavailable', articles: [] };
};

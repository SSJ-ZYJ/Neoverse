import { createEmptyProjectPreviews, SITE } from '#shared/constants';
import type { DocsPreviewLocale, DocsProjectPreview, ProjectPreviews } from '#shared/types/projects';
import { parseBlogFeed, parseDocsChapterUrls, parseDocsPage } from '../../utils/project-previews';

const fetchText = (url: string) =>
  $fetch<string>(url, {
    responseType: 'text',
    timeout: 7000,
    retry: 1,
    headers: { Accept: 'text/html, application/xml;q=0.9, text/xml;q=0.8, text/plain;q=0.7' },
  });

const buildDocsPreview = async (sitemap: string, fallback: DocsProjectPreview): Promise<DocsProjectPreview> => {
  const chapterUrls = parseDocsChapterUrls(sitemap);
  const requests = (Object.entries(chapterUrls) as Array<[DocsPreviewLocale, string[]]>).flatMap(([locale, urls]) =>
    [
      { url: `${SITE.docs}/${locale}/docs/about`, pinned: true },
      ...urls.slice(0, 3).map((url) => ({ url, pinned: false })),
    ].map(async ({ url, pinned }) => ({ locale, pinned, content: parseDocsPage(await fetchText(url), url) })),
  );
  const results = await Promise.allSettled(requests);
  const content: DocsProjectPreview['content'] = { en: [], zh: [] };
  const featured: Record<DocsPreviewLocale, DocsProjectPreview['content'][DocsPreviewLocale][number] | undefined> = {
    en: fallback.content.en.find((item) => item.featured),
    zh: fallback.content.zh.find((item) => item.featured),
  };

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.content) {
      if (result.value.pinned) featured[result.value.locale] = { ...result.value.content, featured: true };
      else content[result.value.locale].push(result.value.content);
    }
  }

  for (const locale of ['en', 'zh'] as const) {
    const featuredItem = featured[locale];
    if (featuredItem) content[locale].push(featuredItem);
  }

  return { kind: 'docs', source: 'sitemap', content };
};

export default defineCachedEventHandler(
  async (): Promise<ProjectPreviews> => {
    const empty = createEmptyProjectPreviews();
    const [docsResult, blogResult] = await Promise.allSettled([
      fetchText(`${SITE.docs}/sitemap.xml`).then((sitemap) => buildDocsPreview(sitemap, empty.docs)),
      fetchText(`${SITE.blog}/rss.xml`).then(parseBlogFeed),
    ]);

    const docs = docsResult.status === 'fulfilled' ? docsResult.value : empty.docs;
    const blog = blogResult.status === 'fulfilled' ? blogResult.value : empty.blog;
    const hasLiveSource = docs.source === 'sitemap' || blog.source === 'rss';

    return {
      docs,
      blog,
      updatedAt: hasLiveSource ? new Date().toISOString() : null,
    };
  },
  {
    getKey: () => 'project-previews-v5',
    maxAge: 900,
    swr: true,
  },
);

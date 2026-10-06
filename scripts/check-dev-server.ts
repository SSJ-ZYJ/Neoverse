const base = process.env.NEOVERSE_TEST_URL ?? 'http://localhost:3000/';

for (const route of ['/', '/projects', '/focus', '/pulse', '/design']) {
  const url = new URL(route, base);
  const response = await fetch(url, {
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(60_000),
  });
  const html = await response.text();

  if (!response.ok) throw new Error(`Development SSR failed at ${route}: HTTP ${response.status}`);
  if (!html.includes('id="__nuxt"')) throw new Error(`Missing Nuxt app at ${route}.`);
  if (!html.includes('/@vite/client'))
    throw new Error('This check requires a development server, not a production preview.');

  console.log(`Development SSR passes at ${route}.`);
}

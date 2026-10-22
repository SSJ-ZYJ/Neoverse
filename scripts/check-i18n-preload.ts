import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.NEOVERSE_TEST_URL ?? 'http://localhost:3000/';
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  const localeResponses: { locale: string; finishedAt: number }[] = [];
  const localeRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/_i18n/') && url.pathname.endsWith('/messages.json')) {
      localeRequests.push(url.pathname);
    }
  });
  page.on('requestfinished', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/_i18n/') && url.pathname.endsWith('/messages.json')) {
      const locale = url.pathname.split('/').at(-2);
      if (locale) localeResponses.push({ locale, finishedAt: Date.now() });
    }
  });

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert.equal(
    await page.locator('script[src*="/@vite/client"]').count(),
    0,
    'Run this check against a production preview.',
  );
  await page.waitForSelector('.home-intro');
  await page.waitForSelector('.home-intro', { state: 'detached', timeout: 30_000 });
  const introFinishedAt = Date.now();

  assert.ok(localeResponses.some(({ locale, finishedAt }) => locale === 'en' && finishedAt <= introFinishedAt));
  assert.ok(
    localeResponses.some(({ locale, finishedAt }) => locale === 'zh-CN' && finishedAt <= introFinishedAt),
    'Simplified Chinese messages must preload before the opening intro finishes.',
  );

  const requestsBeforeSwitch = localeRequests.length;
  await page.getByRole('radio', { name: 'Select 简体中文' }).click();
  await page.locator('#home').getByText('去探索 · 去梦想 · 去发现', { exact: true }).waitFor();
  await page.waitForFunction(() => document.documentElement.lang === 'zh-CN');
  assert.equal(
    (await page.context().cookies(base)).find((cookie) => cookie.name === 'neoverse_locale')?.value,
    'zh-CN',
  );
  assert.equal(localeRequests.length, requestsBeforeSwitch, 'Switching to Chinese must not request locale messages.');

  await page.getByRole('radio', { name: '选择English' }).click();
  await page.locator('#home').getByText('Explore. Dream. Discover.', { exact: true }).waitFor();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.equal((await page.context().cookies(base)).find((cookie) => cookie.name === 'neoverse_locale')?.value, 'en');
  assert.equal(
    localeRequests.length,
    requestsBeforeSwitch,
    'Switching back to English must not request locale messages.',
  );

  console.log('Both language switches use messages preloaded during the opening intro.');
} finally {
  await browser.close();
}

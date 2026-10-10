import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { installCssZoomGeometry } from '../app/utils/browserGeometry';

// VS Code's built-in Browser disables StandardizedBrowserZoom. Exercise that
// exact engine setting as well as Chromium's default coordinate behavior.
for (const legacy of [true, false]) {
  const browser = await chromium.launch({
    args: legacy ? ['--disable-blink-features=StandardizedBrowserZoom'] : [],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1272, height: 848 },
      deviceScaleFactor: 1.5,
    });
    await page.addInitScript(() => {
      const original = Element.prototype.getBoundingClientRect;
      Object.defineProperty(window, 'geometryPatched', {
        get: () => Element.prototype.getBoundingClientRect !== original,
      });
    });
    await page.goto(process.env.GEOMETRY_TEST_URL ?? 'http://localhost:3000');
    await page.waitForSelector('.app-view-content--booting', { state: 'detached' });
    await page.waitForSelector('.home-intro', { state: 'detached' });
    await page.waitForSelector('.home-socials a');
    await page.waitForTimeout(1000);
    assert.equal(await page.evaluate(() => Reflect.get(window, 'geometryPatched')), legacy);
    // HMR or a second setup must not multiply the coordinates a second time.
    await page.evaluate(installCssZoomGeometry);
    for (const zoom of [1, 0.8, 1.25, 1.5]) {
      const result = await page.evaluate((scale) => {
        const marker = document
          .querySelector('.ui-navigation-item--active .ui-navigation-item__indicator')
          ?.getBoundingClientRect();
        const indicator = document.querySelector('.ui-control-surface__indicator')?.getBoundingClientRect();
        if (!marker || !indicator) throw new Error('Navigation indicator missing');
        const error = Math.max(
          Math.abs(marker.x - indicator.x),
          Math.abs(marker.y - indicator.y),
          Math.abs(marker.width - indicator.width),
          Math.abs(marker.height - indicator.height),
        );
        const linksAligned = [...document.querySelectorAll<HTMLAnchorElement>('.home-socials a')].every((link) => {
          const rect = link.getBoundingClientRect();
          return link.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
        });
        const fixture = document.createElement('div');
        fixture.style.cssText = `position:fixed;left:30px;top:30px;zoom:${1.25 * scale};z-index:2147483647;`;
        const child = document.createElement('div');
        child.style.cssText = 'width:17px;height:19px;zoom:0.8;transform:translate(3px,4px);';
        fixture.append(child);
        document.body.append(fixture);
        try {
          const rect = child.getBoundingClientRect();
          const rects = child.getClientRects();
          const firstRect = rects[0];
          const itemRect = rects.item(0);
          if (!firstRect || !itemRect) throw new Error('Client rect list missing');
          return {
            error,
            linksAligned,
            widthError: Math.abs(rect.width - 17 * scale),
            heightError: Math.abs(rect.height - 19 * scale),
            rectListError: Math.abs(firstRect.x - rect.x) + Math.abs(itemRect.y - rect.y),
            iterable: [...rects].length === rects.length && rects.item(99) === null,
            fixtureAligned: child.contains(
              document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
            ),
          };
        } finally {
          fixture.remove();
        }
      }, zoom);
      const label = `${legacy ? 'VS Code' : 'standard'}, nested CSS zoom ${zoom * 100}%`;
      assert.ok(result.error < 0.75, `${label}: indicator misaligned by ${result.error.toFixed(2)}px`);
      assert.ok(result.linksAligned, `${label}: social glass rectangles differ from painted links`);
      assert.ok(
        result.fixtureAligned && result.widthError < 0.1 && result.heightError < 0.1,
        `${label}: nested zoom / transform coordinates differ from viewport pixels`,
      );
      assert.ok(result.iterable && result.rectListError < 0.01, `${label}: client rect list inconsistent`);
      console.log(`${label}: geometry aligned`);
    }
  } finally {
    await browser.close();
  }
}

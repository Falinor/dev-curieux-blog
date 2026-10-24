import { test, expect } from '@playwright/test';
import { builtPages } from './support/pages';

// This site is built without an analytics token, like a local build.
test('without a token, no page includes the analytics beacon', async ({ page }, testInfo) => {
  const pages = await builtPages(testInfo);
  expect(pages).toEqual(
    expect.arrayContaining(['/', '/premier-post/', '/tags/astro/', '/404.html']),
  );

  for (const path of pages) {
    await page.goto(path);

    await expect(page.locator('script[src*="cloudflareinsights.com"]'), path).toHaveCount(0);
  }
});

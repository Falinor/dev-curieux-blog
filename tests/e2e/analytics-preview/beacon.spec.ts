import { test, expect } from '@playwright/test';
import { builtPages } from '../support/pages';

// This site is built with a token, from a branch other than `main`
// (playwright.config.ts): a preview build.
test('a preview build ignores the token: no page includes the analytics beacon', async ({
  page,
}, testInfo) => {
  const pages = await builtPages(testInfo);
  expect(pages).toEqual(
    expect.arrayContaining(['/', '/premier-post/', '/tags/astro/', '/404.html']),
  );

  for (const path of pages) {
    await page.goto(path);

    await expect(page.locator('script[src*="cloudflareinsights.com"]'), path).toHaveCount(0);
  }
});

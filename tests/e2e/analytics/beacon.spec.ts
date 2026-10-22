import { test, expect } from '@playwright/test';
import { builtPages } from '../support/pages';

// This site is built with `CF_BEACON_TOKEN=test-token` (playwright.config.ts).
const beacon = 'script[src="https://static.cloudflareinsights.com/beacon.min.js"]';

// The suite stays offline: the beacon itself is never fetched.
test.beforeEach(async ({ context }) => {
  await context.route('https://static.cloudflareinsights.com/**', (route) => route.abort());
});

test('with a token configured, every page includes the analytics beacon with that token', async ({
  page,
}, testInfo) => {
  const pages = await builtPages(testInfo);
  expect(pages).toEqual(
    expect.arrayContaining(['/', '/premier-post/', '/tags/astro/', '/404.html']),
  );

  for (const path of pages) {
    await page.goto(path);

    const script = page.locator(beacon);
    await expect(script, path).toHaveCount(1);
    expect(JSON.parse((await script.getAttribute('data-cf-beacon')) ?? '{}'), path).toEqual({
      token: 'test-token',
    });
  }
});

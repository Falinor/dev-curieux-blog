import { test, expect, type Page } from '@playwright/test';
import { builtPages } from './support/pages';

// What search engines and link previews read in a page's head.

const site = 'https://blog.curieux.dev';
const notFound = '/404.html';

const content = (page: Page, selector: string) =>
  page
    .locator(`head ${selector}`)
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('content') ?? element.getAttribute('href')),
    );

test('every page has its own title and a description', async ({ page }, testInfo) => {
  const titles = new Map<string, string>();
  for (const path of await builtPages(testInfo)) {
    await page.goto(path);

    const title = await page.title();
    expect(title.trim(), path).not.toBe('');
    expect(titles.get(title), `${path} has the title of another page`).toBeUndefined();
    titles.set(title, path);
    const descriptions = await content(page, 'meta[name="description"]');
    expect(descriptions, path).toHaveLength(1);
    expect(descriptions[0]?.trim(), path).toBeTruthy();
  }
});

test('every page but the 404 page declares its own URL on blog.curieux.dev as canonical', async ({
  page,
}, testInfo) => {
  for (const path of await builtPages(testInfo)) {
    if (path === notFound) continue;
    await page.goto(path);

    expect(await content(page, 'link[rel="canonical"]'), path).toEqual([`${site}${path}`]);
    expect(await content(page, 'meta[name="robots"]'), path).toEqual([]);
  }
});

test('the 404 page asks search engines not to index it, and declares no canonical URL', async ({
  page,
}) => {
  const response = await page.goto('/page-inconnue/');

  expect(response?.status()).toBe(404);
  expect(await content(page, 'meta[name="robots"]')).toEqual(['noindex']);
  expect(await content(page, 'link[rel="canonical"]')).toEqual([]);
});

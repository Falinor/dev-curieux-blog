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

test('every page but the 404 page has Open Graph and Twitter card tags for link previews', async ({
  page,
}, testInfo) => {
  for (const path of await builtPages(testInfo)) {
    if (path === notFound) continue;
    await page.goto(path);
    const english = path.startsWith('/en/');

    expect(await content(page, 'meta[property="og:site_name"]'), path).toEqual(['Dev curieux']);
    expect(await content(page, 'meta[property="og:url"]'), path).toEqual([`${site}${path}`]);
    expect(await content(page, 'meta[property="og:locale"]'), path).toEqual([
      english ? 'en_GB' : 'fr_FR',
    ]);
    for (const property of ['og:type', 'og:title', 'og:description', 'og:image:alt']) {
      const [value, ...others] = await content(page, `meta[property="${property}"]`);
      expect(value?.trim(), `${path} ${property}`).toBeTruthy();
      expect(others, `${path} ${property}`).toEqual([]);
    }
    const [image] = await content(page, 'meta[property="og:image"]');
    expect(image, path).toMatch(new RegExp(`^${site}/(en/)?([a-z0-9-]+/)?og\\.png$`));
    expect(await content(page, 'meta[property="og:image:width"]'), path).toEqual(['1200']);
    expect(await content(page, 'meta[property="og:image:height"]'), path).toEqual(['630']);
    expect(await content(page, 'meta[property="og:image:type"]'), path).toEqual(['image/png']);
    expect(await content(page, 'meta[name="twitter:card"]'), path).toEqual(['summary_large_image']);
    expect(await content(page, 'meta[name="twitter:image"]'), path).toEqual([image]);
  }
});

test('a Post page describes the Post to link previews: title, description, dates, Tags, language', async ({
  page,
}) => {
  await page.goto('/second-post/');

  expect(await content(page, 'meta[property="og:type"]')).toEqual(['article']);
  expect(await content(page, 'meta[property="og:title"]')).toEqual(['Un second Post']);
  expect(await content(page, 'meta[property="og:description"]')).toEqual([
    'Un Post plus long, mis à jour depuis sa publication.',
  ]);
  expect(await content(page, 'meta[property="og:locale"]')).toEqual(['fr_FR']);
  // `second-post` has no Translation.
  expect(await content(page, 'meta[property="og:locale:alternate"]')).toEqual([]);
  expect(await content(page, 'meta[property="og:image"]')).toEqual([`${site}/second-post/og.png`]);
  expect(await content(page, 'meta[property="article:published_time"]')).toEqual([
    '2026-09-15T00:00:00.000Z',
  ]);
  expect(await content(page, 'meta[property="article:modified_time"]')).toEqual([
    '2026-10-01T00:00:00.000Z',
  ]);
  expect(await content(page, 'meta[property="article:tag"]')).toEqual(['Astro']);
});

test('an English Post page describes the Translation to link previews, with the Post’s dates and English Tags', async ({
  page,
}) => {
  await page.goto('/en/premier-post/');

  expect(await content(page, 'meta[property="og:type"]')).toEqual(['article']);
  expect(await content(page, 'meta[property="og:title"]')).toEqual(['My first post']);
  expect(await content(page, 'meta[property="og:description"]')).toEqual([
    'The very first post on the blog, to check that everything works.',
  ]);
  expect(await content(page, 'meta[property="og:locale"]')).toEqual(['en_GB']);
  expect(await content(page, 'meta[property="og:locale:alternate"]')).toEqual(['fr_FR']);
  expect(await content(page, 'meta[property="og:image"]')).toEqual([
    `${site}/en/premier-post/og.png`,
  ]);
  expect(await content(page, 'meta[property="article:published_time"]')).toEqual([
    '2026-09-01T00:00:00.000Z',
  ]);
  // Never updated: no modification date.
  expect(await content(page, 'meta[property="article:modified_time"]')).toEqual([]);
  expect(await content(page, 'meta[property="article:tag"]')).toEqual(['Product', 'Astro']);
});

test('pages that are not Posts are websites, previewed with their language’s home image', async ({
  page,
}) => {
  for (const [path, image] of [
    ['/', `${site}/og.png`],
    ['/en/tags/astro/', `${site}/en/og.png`],
  ]) {
    await page.goto(path);

    expect(await content(page, 'meta[property="og:type"]'), path).toEqual(['website']);
    expect(await content(page, 'meta[property="og:image"]'), path).toEqual([image]);
    expect(await content(page, 'meta[property^="article:"]'), path).toEqual([]);
  }
});

const structuredData = (page: Page) =>
  page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? '')));

test('a Post page carries BlogPosting structured data: title, description, dates, language', async ({
  page,
}) => {
  await page.goto('/second-post/');

  expect(await structuredData(page)).toEqual([
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Un second Post',
      description: 'Un Post plus long, mis à jour depuis sa publication.',
      inLanguage: 'fr',
      datePublished: '2026-09-15T00:00:00.000Z',
      dateModified: '2026-10-01T00:00:00.000Z',
      url: `${site}/second-post/`,
      mainEntityOfPage: `${site}/second-post/`,
      image: `${site}/second-post/og.png`,
      keywords: ['Astro'],
      author: { '@type': 'Person', name: 'Dev curieux', url: 'https://curieux.dev' },
    },
  ]);
});

test('an English Post page carries BlogPosting structured data for the Translation of the French Post', async ({
  page,
}) => {
  await page.goto('/en/premier-post/');

  expect(await structuredData(page)).toEqual([
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'My first post',
      description: 'The very first post on the blog, to check that everything works.',
      inLanguage: 'en',
      datePublished: '2026-09-01T00:00:00.000Z',
      // Never updated: modified when published.
      dateModified: '2026-09-01T00:00:00.000Z',
      url: `${site}/en/premier-post/`,
      mainEntityOfPage: `${site}/en/premier-post/`,
      image: `${site}/en/premier-post/og.png`,
      keywords: ['Product', 'Astro'],
      author: { '@type': 'Person', name: 'Dev curieux', url: 'https://curieux.dev' },
      translationOfWork: { '@id': `${site}/premier-post/` },
    },
  ]);
});

test('pages that are not Posts carry no BlogPosting', async ({ page }) => {
  for (const path of ['/', '/en/', '/tags/astro/', '/page-inconnue/']) {
    await page.goto(path);

    expect(await structuredData(page), path).toEqual([]);
  }
});

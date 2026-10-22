import { test, expect, type Page } from '@playwright/test';
import { builtPages } from './support/pages';

// The sitemap search engines read: `/sitemap-index.xml`, which lists the
// sitemap files, each listing pages (`<url>`) with their other-language
// versions (`xhtml:link rel="alternate"`).

const site = 'https://blog.curieux.dev';

interface SitemapUrl {
  loc: string;
  alternates: [string | null, string | null][];
}

/**
 * Every page the sitemap lists, following its index. Runs in the browser, on a
 * page of the site under test, so it fetches the site's own files.
 */
async function sitemapUrls(page: Page): Promise<SitemapUrl[]> {
  await page.goto('/');
  return page.evaluate(async (origin) => {
    // A URL of blog.curieux.dev, fetched from the site under test.
    const read = async (url: string) => {
      if (!url.startsWith(`${origin}/`)) throw new Error(`${url} is not on ${origin}`);
      const response = await fetch(new URL(url).pathname);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      const doc = new DOMParser().parseFromString(await response.text(), 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error(`${url} is not well-formed XML`);
      return doc;
    };
    const index = await read(`${origin}/sitemap-index.xml`);
    const files = [...index.querySelectorAll('sitemapindex > sitemap > loc')];
    if (files.length === 0) throw new Error('The sitemap index lists no sitemap');
    const sitemaps = await Promise.all(files.map((loc) => read(loc.textContent ?? '')));
    return sitemaps.flatMap((doc) =>
      [...doc.querySelectorAll('urlset > url')].map((url) => ({
        loc: url.querySelector(':scope > loc')?.textContent ?? '',
        alternates: [...url.children]
          .filter(
            (child) => child.localName === 'link' && child.getAttribute('rel') === 'alternate',
          )
          .map((link): [string | null, string | null] => [
            link.getAttribute('hreflang'),
            link.getAttribute('href'),
          ]),
      })),
    );
  }, site);
}

test('the sitemap lists every French and English page on blog.curieux.dev, but not the 404 page', async ({
  page,
}, testInfo) => {
  const pages = (await builtPages(testInfo)).filter((path) => path !== '/404.html');

  const locs = (await sitemapUrls(page)).map(({ loc }) => loc);

  expect(locs.toSorted()).toEqual(pages.map((path) => `${site}${path}`).toSorted());
  expect(locs).toContain(`${site}/premier-post/`);
  expect(locs).toContain(`${site}/en/premier-post/`);
  expect(locs).toContain(`${site}/en/tags/astro/`);
});

test('the sitemap lists no Draft, in either language', async ({ page }) => {
  const locs = (await sitemapUrls(page)).map(({ loc }) => loc);

  expect(locs).not.toContain(`${site}/brouillon/`);
  expect(locs).not.toContain(`${site}/en/brouillon/`);
});

test('the sitemap pairs a Post with its Translation, and leaves a Post without one alone', async ({
  page,
}) => {
  const urls = await sitemapUrls(page);
  const alternatesOf = (path: string) =>
    urls.find(({ loc }) => loc === `${site}${path}`)?.alternates.toSorted();
  const pair = [
    ['en', `${site}/en/premier-post/`],
    ['fr', `${site}/premier-post/`],
  ];

  expect(alternatesOf('/premier-post/')).toEqual(pair);
  expect(alternatesOf('/en/premier-post/')).toEqual(pair);
  expect(alternatesOf('/second-post/')).toEqual([]);
});

test('robots.txt allows crawling and points to the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');

  expect(response.status()).toBe(200);
  const robots = await response.text();
  expect(robots).toMatch(/^User-agent: \*$/m);
  expect(robots).not.toMatch(/^Disallow: \/\S*$/m);
  expect(robots).toMatch(new RegExp(`^Sitemap: ${site}/sitemap-index.xml$`, 'm'));
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
});

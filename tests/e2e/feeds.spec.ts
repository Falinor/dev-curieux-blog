import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { builtPages } from './support/pages';

// The RSS feeds: `/rss.xml` lists the French Posts, `/en/rss.xml` the
// Translations. In the fixture site, the Draft `brouillon` is the newest Post
// and has a Translation; `second-post` has no Translation.

const site = 'https://blog.curieux.dev';

interface Feed {
  /** The XML parser's error, if the feed isn't well-formed. */
  error: string | null;
  version: string | null;
  channel: Record<'title' | 'link' | 'description' | 'language', string | undefined>;
  /** `atom:link rel="self"`: where the feed says it lives. */
  self: string | null | undefined;
  items: {
    title?: string;
    link?: string;
    guid?: string;
    pubDate?: string;
    description?: string;
    categories: string[];
  }[];
}

/** Fetches a feed and reads it with the browser's XML parser. */
async function readFeed(page: Page, request: APIRequestContext, path: string): Promise<Feed> {
  const response = await request.get(path);
  expect(response.status(), path).toBe(200);
  expect(response.headers()['content-type'], path).toContain('xml');
  return page.evaluate(
    (xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      // Runs in the browser: everything it uses must be defined in here.
      // oxlint-disable-next-line unicorn/consistent-function-scoping
      const text = (parent: Element | null | undefined, name: string) =>
        parent?.querySelector(`:scope > ${name}`)?.textContent ?? undefined;
      const channel = doc.querySelector('rss > channel');
      return {
        error: doc.querySelector('parsererror')?.textContent ?? null,
        version: doc.documentElement.getAttribute('version'),
        channel: {
          title: text(channel, 'title'),
          link: text(channel, 'link'),
          description: text(channel, 'description'),
          language: text(channel, 'language'),
        },
        self: [...(channel?.children ?? [])]
          .find((child) => child.localName === 'link' && child.getAttribute('rel') === 'self')
          ?.getAttribute('href'),
        items: [...doc.querySelectorAll('rss > channel > item')].map((item) => ({
          title: text(item, 'title'),
          link: text(item, 'link'),
          guid: text(item, 'guid'),
          pubDate: text(item, 'pubDate'),
          description: text(item, 'description'),
          categories: [...item.querySelectorAll(':scope > category')].map(
            (category) => category.textContent ?? '',
          ),
        })),
      };
    },
    await response.text(),
  );
}

/** An RFC 822 date, as RSS 2.0 requires: `Mon, 05 Oct 2026 00:00:00 GMT`. */
const rfc822 = /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} (GMT|[+-]\d{4})$/;

test('/rss.xml is a valid RSS 2.0 feed of the French Posts, newest first, without Drafts', async ({
  page,
  request,
}) => {
  const feed = await readFeed(page, request, '/rss.xml');

  expect(feed.error).toBeNull();
  expect(feed.version).toBe('2.0');
  expect(feed.channel).toEqual({
    title: 'Dev curieux — le blog',
    link: `${site}/`,
    description: expect.stringMatching(/\S/),
    language: 'fr',
  });
  expect(feed.self).toBe(`${site}/rss.xml`);
  expect(feed.items.map(({ title, link }) => [title, link])).toEqual([
    ['Un troisième Post', `${site}/troisieme-post/`],
    ['Un second Post', `${site}/second-post/`],
    ['Un Post épinglé récent', `${site}/epingle-recent/`],
    ['Mon premier Post', `${site}/premier-post/`],
    ['Un Post épinglé ancien', `${site}/epingle-ancien/`],
    ['IntersectionObserver en vrai', `${site}/intersection-observer/`],
  ]);
  for (const item of feed.items) {
    expect(item.guid, item.title).toBe(item.link);
    expect(item.pubDate, item.title).toMatch(rfc822);
  }
  expect(feed.items[3]).toMatchObject({
    description: 'Le tout premier Post du blog, pour vérifier que tout fonctionne.',
    pubDate: 'Tue, 01 Sep 2026 00:00:00 GMT',
    categories: ['Produit', 'Astro'],
  });
});

test('/en/rss.xml is a valid RSS 2.0 feed of the Translations, newest first, without Drafts', async ({
  page,
  request,
}) => {
  const feed = await readFeed(page, request, '/en/rss.xml');

  expect(feed.error).toBeNull();
  expect(feed.version).toBe('2.0');
  expect(feed.channel).toEqual({
    title: 'Dev curieux — the blog',
    link: `${site}/en/`,
    description: expect.stringMatching(/\S/),
    language: 'en',
  });
  expect(feed.self).toBe(`${site}/en/rss.xml`);
  // `second-post` has no Translation: the English feed leaves it out.
  expect(feed.items.map(({ title, link }) => [title, link])).toEqual([
    ['A third post', `${site}/en/troisieme-post/`],
    ['A recent pinned post', `${site}/en/epingle-recent/`],
    ['My first post', `${site}/en/premier-post/`],
    ['An old pinned post', `${site}/en/epingle-ancien/`],
    [
      'useIntersectionObserverWithResizeObserverAndMutationObserverHook, explained',
      `${site}/en/intersection-observer/`,
    ],
  ]);
  for (const item of feed.items) {
    expect(item.guid, item.title).toBe(item.link);
    expect(item.pubDate, item.title).toMatch(rfc822);
  }
  // Dates and Tags come from the Post, Tag labels in English.
  expect(feed.items[2]).toMatchObject({
    description: 'The very first post on the blog, to check that everything works.',
    pubDate: 'Tue, 01 Sep 2026 00:00:00 GMT',
    categories: ['Product', 'Astro'],
  });
});

test('every page points feed readers to the feed of its language', async ({ page }, testInfo) => {
  for (const path of await builtPages(testInfo)) {
    await page.goto(path);
    const english = path.startsWith('/en/');

    const feeds = await page
      .locator('head link[rel="alternate"][type="application/rss+xml"]')
      .evaluateAll((links) =>
        links.map((link) => [link.getAttribute('title'), link.getAttribute('href')]),
      );
    expect(feeds, path).toEqual([
      english ? ['Dev curieux — the blog', '/en/rss.xml'] : ['Dev curieux — le blog', '/rss.xml'],
    ]);
  }
});

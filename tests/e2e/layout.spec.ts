import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'dark' });

// The header and footer are the same on every page.
const pages = ['/', '/premier-post/', '/tags/astro/'];

for (const path of pages) {
  test(`the header of ${path} links home from the badge, and to the Posts, the RSS feed and curieux.dev`, async ({
    page,
  }) => {
    await page.goto(path);

    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Dev curieux' })).toHaveAttribute('href', '/');
    const nav = header.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Posts', exact: true })).toHaveAttribute(
      'href',
      '/#posts',
    );
    await expect(nav.getByRole('link', { name: 'RSS', exact: true })).toHaveAttribute(
      'href',
      '/rss.xml',
    );
    await expect(nav.getByRole('link', { name: 'curieux.dev', exact: true })).toHaveAttribute(
      'href',
      'https://curieux.dev',
    );
  });
}

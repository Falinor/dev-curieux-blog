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

for (const path of pages) {
  test(`the footer of ${path} links to the legal notice and privacy policy on curieux.dev`, async ({
    page,
  }) => {
    await page.goto(path);

    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute(
      'href',
      'https://curieux.dev/mentions-legales',
    );
    await expect(footer.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute(
      'href',
      'https://curieux.dev/confidentialite',
    );
    await expect(footer.getByText('codé au rythme des marées')).toBeVisible();
  });
}

for (const path of pages) {
  test(`${path} has no horizontal scroll at phone width`, async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto(path);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(clientWidth).toBe(400);
    expect(scrollWidth).toBe(clientWidth);
  });
}

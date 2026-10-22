import { test, expect, type Page } from '@playwright/test';
import { builtPages } from './support/pages';

test.use({ colorScheme: 'dark' });

// Pages that exist in both languages.
const counterparts = [
  ['/', '/en/'],
  ['/premier-post/', '/en/premier-post/'],
  ['/tags/astro/', '/en/tags/astro/'],
  ['/tags/accessibilite/', '/en/tags/accessibilite/'],
];

for (const [french, english] of counterparts) {
  test(`the language switch leads from ${french} to ${english} and back`, async ({ page }) => {
    await page.goto(french);
    await page.getByRole('banner').getByRole('link', { name: 'English', exact: true }).click();

    await expect(page).toHaveURL(english);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('banner').getByRole('link', { name: 'Français', exact: true }).click();
    await expect(page).toHaveURL(french);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });
}

test('every page shows a language switch, named in the language it leads to', async ({
  page,
}, testInfo) => {
  for (const path of await builtPages(testInfo)) {
    await page.goto(path);
    const english = path.startsWith('/en/');
    const name = english ? 'Français' : 'English';
    const link = page.getByRole('banner').getByRole('link', { name, exact: true });

    await expect(link, path).toBeVisible();
    await expect(link, path).toHaveAttribute('lang', english ? 'fr' : 'en');
    await expect(link, path).toHaveAttribute('hreflang', english ? 'fr' : 'en');
  }
});

test('on a page with no English counterpart, the language switch leads to the English home page', async ({
  page,
}) => {
  // `second-post` has no Translation; the 404 page exists in French only.
  for (const path of ['/second-post/', '/page-inconnue/']) {
    await page.goto(path);

    await expect(
      page.getByRole('banner').getByRole('link', { name: 'English', exact: true }),
      path,
    ).toHaveAttribute('href', '/en/');
  }
});

const site = 'https://blog.curieux.dev';
const hreflangs = (page: Page) =>
  page
    .locator('head link[rel="alternate"][hreflang]')
    .evaluateAll((links) =>
      links.map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]),
    );

for (const [french, english] of counterparts) {
  test(`${french} and ${english} both declare the French and English pages as hreflang alternates, French as x-default`, async ({
    page,
  }) => {
    for (const path of [french, english]) {
      await page.goto(path);

      expect(await hreflangs(page), path).toEqual([
        ['fr', `${site}${french}`],
        ['en', `${site}${english}`],
        ['x-default', `${site}${french}`],
      ]);
    }
  });
}

test('a page with no counterpart declares no hreflang alternates', async ({ page }) => {
  for (const path of ['/second-post/', '/page-inconnue/']) {
    await page.goto(path);

    expect(await hreflangs(page), path).toEqual([]);
  }
});

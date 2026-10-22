import { test, expect, type Page } from '@playwright/test';

// The `card` token of DESIGN.md in each theme: the badge in the header is a card
// on every page, so its background tells which theme the page is in.
const card = { crepuscule: 'rgb(42, 32, 82)', pleinSoleil: 'rgb(255, 246, 230)' };
const pages = ['/', '/premier-post/', '/tags/astro/'];

const badge = (page: Page) => page.getByRole('banner').getByRole('link', { name: 'Dev curieux' });

test.describe('with a dark system setting and no stored choice', () => {
  test.use({ colorScheme: 'dark' });

  for (const path of pages) {
    test(`${path} renders in « crépuscule »`, async ({ page }) => {
      await page.goto(path);

      await expect(badge(page)).toHaveCSS('background-color', card.crepuscule);
    });
  }
});

test.describe('with a light system setting and no stored choice', () => {
  test.use({ colorScheme: 'light' });

  for (const path of pages) {
    test(`${path} renders in « plein soleil »`, async ({ page }) => {
      await page.goto(path);

      await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);
    });
  }
});

import { test, expect } from '@playwright/test';

test('a Tag page lists every Post with that Tag, newest first', async ({ page }) => {
  await page.goto('/tags/astro/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Astro');
  const posts = page.getByRole('main').getByRole('link');
  await expect(posts).toHaveText(['Un second Post', 'Mon premier Post']);
  await expect(posts.first()).toHaveAttribute('href', '/second-post/');
});

test('a Tag page is titled with the French label of the Tag', async ({ page }) => {
  await page.goto('/tags/produit/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Produit');
  await expect(page.getByRole('main').getByRole('link')).toHaveText(['Mon premier Post']);
});

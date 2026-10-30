import { test, expect } from '@playwright/test';

test('a Post page renders its title and body at its slug URL', async ({ page }) => {
  await page.goto('/premier-post/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mon premier Post');
  await expect(
    page.getByText('Ceci est le corps du premier Post, écrit en français.'),
  ).toBeVisible();
});

test('a Post page shows its publication date, update date, reading time and Tags', async ({
  page,
}) => {
  // The fixture body has 600 words: 3 minutes at 200 words per minute.
  await page.goto('/second-post/');

  await expect(page.getByText('Publié le 15 septembre 2026')).toBeVisible();
  await expect(page.getByText('Mis à jour le 1er octobre 2026')).toBeVisible();
  await expect(page.getByText('3 min de lecture')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Astro', exact: true })).toHaveAttribute(
    'href',
    '/tags/astro/',
  );
});

test('a Post page without an update date shows no update line, and every Tag by its French label', async ({
  page,
}) => {
  await page.goto('/premier-post/');

  await expect(page.getByText('Publié le 1er septembre 2026')).toBeVisible();
  await expect(page.getByText(/Mis à jour/)).toHaveCount(0);
  await expect(page.getByText('1 min de lecture')).toBeVisible();
  const tags = page.getByRole('list', { name: 'Tags' }).getByRole('link');
  await expect(tags).toHaveText(['Produit', 'Astro']);
  await expect(tags.first()).toHaveAttribute('href', '/tags/produit/');
});

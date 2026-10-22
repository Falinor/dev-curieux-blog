import { test, expect } from '@playwright/test';
import { cardAround } from './support/cards';
import { postcards, rows } from './support/postcards';

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

test('a Tag page names its Tag on a title card, inside the page column', async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/tags/astro/');

    const card = await cardAround(page.getByRole('heading', { level: 1 }));
    expect(card, `at ${width}px`).not.toBeNull();
    // Off the edges of the screen, tilt included.
    expect(card!.left, `at ${width}px`).toBeGreaterThan(8);
    expect(card!.right, `at ${width}px`).toBeLessThan(width - 8);
  }
});

test('a Tag page shows its Posts as postcards, newest first, at most two per row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/tags/outillage/');

  // Pinned Posts take no top slot here: a Tag page is newest first only.
  expect(rows(await postcards(page.getByRole('main').getByRole('list')))).toEqual([
    ['Un troisième Post', 'Un Post épinglé récent'],
    ['Un Post épinglé ancien'],
  ]);
});

test('a Tag page postcard shows the description, date, reading time and Tags, with the first Tag as its stamp', async ({
  page,
}) => {
  await page.goto('/tags/astro/');

  const postcard = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'Mon premier Post' }) });
  await expect(postcard).toContainText(
    'Le tout premier Post du blog, pour vérifier que tout fonctionne.',
  );
  await expect(postcard.getByText('1er septembre 2026')).toBeVisible();
  await expect(postcard.getByText('1 min de lecture')).toBeVisible();
  await expect(postcard.getByText('#Produit #Astro')).toBeVisible();
  await expect(postcard.getByText('Produit', { exact: true })).toBeVisible();
});

test('a Tag with no Post yet says so', async ({ page }) => {
  await page.goto('/tags/accessibilite/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accessibilité');
  await expect(page.getByRole('main')).toContainText('Aucun Post pour l’instant.');
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(0);
});

import { test, expect } from '@playwright/test';
import { homePostcards, rows } from './support/postcards';

// Dusk is the reference design: say so now, before the light theme exists.
test.use({ colorScheme: 'dark' });

test('the home page lists every Post with a link to its page', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('link', { name: 'Mon premier Post' })).toHaveAttribute(
    'href',
    '/premier-post/',
  );
  await expect(page.getByRole('link', { name: 'Un second Post' })).toHaveAttribute(
    'href',
    '/second-post/',
  );
});

test('the Pinned Posts come first as featured postcards, newest first, then every other Post, newest first', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const cards = await homePostcards(page);
  expect(cards.map(({ title }) => title)).toEqual([
    'Un Post épinglé récent',
    'Un Post épinglé ancien',
    'Un troisième Post',
    'Un second Post',
    'Mon premier Post',
  ]);
  expect(cards.filter(({ spansGrid }) => spansGrid).map(({ title }) => title)).toEqual([
    'Un Post épinglé récent',
    'Un Post épinglé ancien',
  ]);
});

test('at desktop width no row holds more than two postcards', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  // Two featured postcards, then three others: two on a row, one on the next.
  expect(rows(await homePostcards(page))).toEqual([
    ['Un Post épinglé récent'],
    ['Un Post épinglé ancien'],
    ['Un troisième Post', 'Un second Post'],
    ['Mon premier Post'],
  ]);
});

test('a postcard shows the description, date, reading time and Tags, with the first Tag as its stamp', async ({
  page,
}) => {
  await page.goto('/');

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

test('keyboard focus moves from the header to the postcards and is always visible', async ({
  page,
}) => {
  await page.goto('/');
  const outlineOf = (selector: string) =>
    page.evaluate((s) => getComputedStyle(document.querySelector(s)!).outlineStyle, selector);

  for (const name of ['Dev curieux blog', 'Posts', 'RSS', 'curieux.dev']) {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name, exact: true })).toBeFocused();
    expect(await outlineOf(':focus')).toBe('solid');
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Passer en plein soleil' })).toBeFocused();
  expect(await outlineOf(':focus')).toBe('solid');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Un Post épinglé récent' })).toBeFocused();
  // The postcard, the link's whole hit area, carries the focus ring.
  expect(await outlineOf('li:focus-within')).toBe('solid');
});

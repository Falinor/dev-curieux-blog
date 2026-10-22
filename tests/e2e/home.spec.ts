import { test, expect } from '@playwright/test';
import { homePostcards } from './support/postcards';

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

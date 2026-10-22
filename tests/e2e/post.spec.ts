import { test, expect } from '@playwright/test';
import { cardAround } from './support/cards';

// Dusk is the reference design.
test.use({ colorScheme: 'dark' });

// « Crépuscule » token values from DESIGN.md, as computed styles report them.
const dusk = {
  edge: 'rgb(6, 3, 13)',
  card: 'rgb(42, 32, 82)',
};
const outline = `3px solid ${dusk.edge}`;
const shadow = (offset: number) => `${dusk.edge} ${offset}px ${offset}px 0px 0px`;

test('a Post page renders its title and body at its slug URL', async ({ page }) => {
  await page.goto('/premier-post/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mon premier Post');
  await expect(
    page.getByText('Ceci est le corps du premier Post, écrit en français.'),
  ).toBeVisible();
});

test('a Post opens on a title postcard overlapping the horizon, with its dates, reading time, description and Tags', async ({
  page,
}) => {
  // The fixture body has 600 words: 3 minutes at 200 words per minute.
  await page.goto('/second-post/');

  const titleCard = await cardAround(
    page.getByRole('heading', { level: 1, name: 'Un second Post' }),
  );
  expect(titleCard).toMatchObject({ outline, shadow: shadow(8), background: dusk.card });
  expect(titleCard?.transform, 'tilted like a postcard').not.toBe('none');
  const scene = await page.getByRole('banner').boundingBox();
  expect(titleCard!.top, 'above the bottom of the scene').toBeLessThan(scene!.y + scene!.height);

  for (const text of [
    'Publié le 15 septembre 2026',
    'Mis à jour le 1er octobre 2026',
    '3 min de lecture',
    'Un Post plus long, mis à jour depuis sa publication.',
  ]) {
    await expect(page.getByText(text)).toBeVisible();
    expect(await cardAround(page.getByText(text)), `${text} is on the title card`).toEqual(
      titleCard,
    );
  }
  const tags = page.getByRole('list', { name: 'Tags' });
  expect(await cardAround(tags), 'the Tags are on the title card').toEqual(titleCard);
  await expect(tags.getByRole('link', { name: 'Astro', exact: true })).toHaveAttribute(
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
  await expect(tags).toHaveCount(2);
  await expect(tags.nth(0)).toHaveAccessibleName('Produit');
  await expect(tags.nth(0)).toHaveAttribute('href', '/tags/produit/');
  await expect(tags.nth(1)).toHaveAccessibleName('Astro');
  await expect(tags.nth(1)).toHaveAttribute('href', '/tags/astro/');
});

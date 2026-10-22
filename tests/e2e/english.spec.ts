import { test, expect } from '@playwright/test';
import { homePostcards } from './support/postcards';

// The English mirror under `/en/`, built from the fixture Translations
// (`tests/fixtures/site/posts/<slug>.en.mdx`). `second-post` has no Translation;
// the Draft `brouillon` has one, which readers must never see either.
test.use({ colorScheme: 'dark' });

test('the English home page lists the translated Posts as postcards, Pinned Posts first, then newest first', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const cards = await homePostcards(page, 'Latest news');
  expect(cards.map(({ title }) => title)).toEqual([
    'A recent pinned post',
    'An old pinned post',
    'A third post',
    'My first post',
  ]);
  expect(cards.filter(({ spansGrid }) => spansGrid).map(({ title }) => title)).toEqual([
    'A recent pinned post',
    'An old pinned post',
  ]);
  await expect(page.getByRole('link', { name: 'My first post' })).toHaveAttribute(
    'href',
    '/en/premier-post/',
  );
});

test('an English postcard shows the Translation, with the date, reading time and Tags in English', async ({
  page,
}) => {
  await page.goto('/en/');

  const postcard = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'My first post' }) });
  await expect(postcard).toContainText(
    'The very first post on the blog, to check that everything works.',
  );
  await expect(postcard.getByText('1 September 2026')).toBeVisible();
  await expect(postcard.getByText('1 min read')).toBeVisible();
  await expect(postcard.getByText('#Product #Astro')).toBeVisible();
  await expect(postcard.getByText('Product', { exact: true })).toBeVisible();
});

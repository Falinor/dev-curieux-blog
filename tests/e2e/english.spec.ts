import { test, expect } from '@playwright/test';
import { cardAround } from './support/cards';
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

test('an English Post page shows the Translation, with the dates, reading time and Tags of its Post in English', async ({
  page,
}) => {
  await page.goto('/en/premier-post/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('My first post');
  for (const text of [
    'The very first post on the blog, to check that everything works.',
    'Published on 1 September 2026',
    '1 min read',
    'Hello! This is the body of the first post, translated into English.',
  ]) {
    await expect(page.getByText(text)).toBeVisible();
  }
  const tags = page.getByRole('list', { name: 'Tags' }).getByRole('link');
  await expect(tags).toHaveCount(2);
  await expect(tags.nth(0)).toHaveAccessibleName('Product');
  await expect(tags.nth(0)).toHaveAttribute('href', '/en/tags/produit/');
  await expect(tags.nth(1)).toHaveAccessibleName('Astro');
  await expect(tags.nth(1)).toHaveAttribute('href', '/en/tags/astro/');
  const reply = page.getByRole('article').getByRole('region', { name: 'Reply' });
  await expect(reply.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
  await expect(reply.getByText('contact@curieux.dev', { exact: true })).toBeVisible();
});

test('an English Post page says it was machine-translated from French, between its title and its body, and links to the original', async ({
  page,
}) => {
  await page.goto('/en/premier-post/');

  const notice = page.getByText('This post was machine-translated from French.');
  await expect(notice).toBeVisible();
  const title = await cardAround(page.getByRole('heading', { level: 1 }));
  const body = await page.getByText('Hello! This is the body of the first post').boundingBox();
  const box = await notice.boundingBox();
  expect(box!.y, 'below the title card').toBeGreaterThan(title!.bottom);
  expect(box!.y + box!.height, 'above the body').toBeLessThan(body!.y);

  await page.getByRole('link', { name: 'Read the original' }).click();
  await expect(page).toHaveURL('/premier-post/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mon premier Post');
  await expect(page.getByText(/machine-translated/)).toHaveCount(0);
});

test('an English Post renders its body like a French one, with the images next to the Post', async ({
  page,
}) => {
  await page.goto('/en/troisieme-post/');
  const article = page.getByRole('article');

  await expect(article.getByRole('heading', { level: 2, name: 'The problem' })).toBeVisible();
  await expect(article.getByRole('blockquote')).toContainText('Drafts are never translated');
  await expect(article.locator('pre')).toContainText('export function isStale');
  const image = article.getByRole('img', { name: 'The sun sets behind the waves' });
  await expect(image).toHaveAttribute('src', /^\/_astro\/coucher-de-soleil\.[\w-]+\.webp$/);
  await expect(image).toHaveAttribute('srcset', /\.webp \d+w,/);
});

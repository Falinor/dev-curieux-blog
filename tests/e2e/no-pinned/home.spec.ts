import { test, expect } from '@playwright/test';
import { homePostcards } from '../support/postcards';

// This project serves `tests/fixtures/no-pinned`: no published Post is pinned,
// and the newest Post is a pinned Draft.
test.use({ colorScheme: 'dark' });

test('with no Pinned Post, the most recent Post is featured and the others follow, newest first', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const cards = await homePostcards(page);
  expect(cards.map(({ title }) => title)).toEqual([
    'Le Post le plus récent',
    'Un Post du milieu',
    'Le Post le plus ancien',
  ]);
  expect(cards.filter(({ spansGrid }) => spansGrid).map(({ title }) => title)).toEqual([
    'Le Post le plus récent',
  ]);
});

test('on the English home page too, the most recent translated Post is featured when nothing is pinned', async ({
  page,
}) => {
  // `le-plus-recent` has no Translation; the pinned Draft has one.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/');

  const cards = await homePostcards(page, 'Latest news');
  expect(cards.map(({ title }) => title)).toEqual(['A post in the middle', 'The oldest post']);
  expect(cards.filter(({ spansGrid }) => spansGrid).map(({ title }) => title)).toEqual([
    'A post in the middle',
  ]);
});

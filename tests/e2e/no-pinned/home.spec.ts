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

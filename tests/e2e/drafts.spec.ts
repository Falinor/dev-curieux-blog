import { test, expect } from '@playwright/test';

test('a Draft is absent from the home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Mon premier Post' })).toBeVisible();
  await expect(page.getByText('Un Post en brouillon')).toHaveCount(0);
});

test('a Draft has no page at its slug URL', async ({ request }) => {
  const response = await request.get('/brouillon/');

  expect(response.status()).toBe(404);
});

test('a Draft is absent from the pages of its Tags', async ({ page }) => {
  for (const tag of ['astro', 'produit']) {
    const response = await page.goto(`/tags/${tag}/`);

    expect(response?.status()).toBe(200);
    await expect(page.getByText('Un Post en brouillon')).toHaveCount(0);
  }
});

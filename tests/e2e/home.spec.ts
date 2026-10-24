import { test, expect } from '@playwright/test';

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

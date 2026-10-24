import { test, expect } from '@playwright/test';

test('a Post page renders its title and body at its slug URL', async ({ page }) => {
  await page.goto('/premier-post/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mon premier Post');
  await expect(
    page.getByText('Ceci est le corps du premier Post, écrit en français.'),
  ).toBeVisible();
});

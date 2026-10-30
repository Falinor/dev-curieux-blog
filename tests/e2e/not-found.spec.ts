import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test('an unknown URL answers 404 with the 404 page, which leads back home', async ({ page }) => {
  const response = await page.goto('/cette-page-n-existe-pas/');

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page introuvable — Dev curieux');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cette page a pris le large');

  await page.getByRole('main').getByRole('link', { name: 'Retour à l’accueil' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('region', { name: 'Dernières nouvelles' })).toBeVisible();
});

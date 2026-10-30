import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({ colorScheme: 'dark' });

const runningAnimations = (page: Page) => page.evaluate(() => document.getAnimations().length);
const transform = (element: Locator) =>
  element.evaluate((node) => getComputedStyle(node).transform);
const firstPostcard = (page: Page) =>
  page.getByRole('region', { name: 'Dernières nouvelles' }).getByRole('listitem').first();

test.describe('with no motion preference', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the waves drift and a postcard straightens on hover', async ({ page }) => {
    await page.goto('/');
    expect(await runningAnimations(page)).toBeGreaterThan(0);

    const postcard = firstPostcard(page);
    const tilted = await transform(postcard);
    await postcard.hover();
    await expect.poll(() => transform(postcard)).not.toBe(tilted);
  });
});

test.describe('with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the waves stay still and postcards do not move on hover', async ({ page }) => {
    await page.goto('/');
    expect(await runningAnimations(page)).toBe(0);

    const postcard = firstPostcard(page);
    const tilted = await transform(postcard);
    await postcard.hover();
    // Nothing starts moving (a transition would be a running animation)…
    expect(await runningAnimations(page)).toBe(0);
    // …and nothing jumps.
    expect(await transform(postcard)).toBe(tilted);
  });
});

import { test, expect, type Page } from '@playwright/test';

// The `card` token of DESIGN.md in each theme: the badge in the header is a card
// on every page, so its background tells which theme the page is in.
const card = { crepuscule: 'rgb(42, 32, 82)', pleinSoleil: 'rgb(255, 246, 230)' };
const pages = ['/', '/premier-post/', '/tags/astro/'];

const badge = (page: Page) => page.getByRole('banner').getByRole('link', { name: 'Dev curieux' });

test.describe('with a dark system setting and no stored choice', () => {
  test.use({ colorScheme: 'dark' });

  for (const path of pages) {
    test(`${path} renders in « crépuscule »`, async ({ page }) => {
      await page.goto(path);

      await expect(badge(page)).toHaveCSS('background-color', card.crepuscule);
    });
  }
});

test.describe('with a light system setting and no stored choice', () => {
  test.use({ colorScheme: 'light' });

  for (const path of pages) {
    test(`${path} renders in « plein soleil »`, async ({ page }) => {
      await page.goto(path);

      await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);
    });
  }
});

test.describe('the theme toggle', () => {
  test.use({ colorScheme: 'dark' });

  test('switches between « crépuscule » and « plein soleil »', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Passer en plein soleil' }).click();
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);

    await page.getByRole('button', { name: 'Passer au crépuscule' }).click();
    await expect(badge(page)).toHaveCSS('background-color', card.crepuscule);
  });

  test('the chosen theme persists across navigation and reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Passer en plein soleil' }).click();

    await page.getByRole('link', { name: 'Mon premier Post' }).click();
    await expect(page).toHaveURL('/premier-post/');
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);
    await expect(page.getByRole('button', { name: 'Passer au crépuscule' })).toBeVisible();

    await page.reload();
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);
  });
});

test.describe('with a stored choice that differs from the system setting', () => {
  test.use({ colorScheme: 'dark' });

  test('the next page is in the chosen theme before its body exists, so it never flashes the other', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Passer en plein soleil' }).click();

    // Nothing can be painted before the body exists: record the theme the root
    // carries at that moment.
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        observer.disconnect();
        Object.assign(window, { themeWhenBodyAppeared: document.documentElement.dataset.theme });
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/premier-post/');

    expect(await page.evaluate(() => Reflect.get(window, 'themeWhenBodyAppeared'))).toBe('light');
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);
  });
});

test.describe('when storage is blocked', () => {
  test.use({ colorScheme: 'light' });

  test('pages follow the system setting and the toggle still works, without errors', async ({
    page,
  }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    // As in a private window or with site data refused: any access throws.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });
    });

    await page.goto('/');
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);

    await page.getByRole('button', { name: 'Passer au crépuscule' }).click();
    await expect(badge(page)).toHaveCSS('background-color', card.crepuscule);

    // The choice could not be kept: the next page follows the system again.
    await page.getByRole('link', { name: 'Mon premier Post' }).click();
    await expect(page).toHaveURL('/premier-post/');
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);
    expect(errors).toEqual([]);
  });
});

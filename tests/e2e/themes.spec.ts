import { test, expect, type Page } from '@playwright/test';
import { lowContrastTexts, type LowContrast } from './support/contrast';
import { weakFocusRings, type WeakFocusRing } from './support/focus';
import { builtPages } from './support/pages';

// The `card` token of DESIGN.md in each theme: the badge in the header is a card
// on every page, so its background tells which theme the page is in.
const card = { crepuscule: 'rgb(42, 32, 82)', pleinSoleil: 'rgb(255, 246, 230)' };
const pages = ['/', '/premier-post/', '/tags/astro/', '/en/', '/en/premier-post/'];

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

    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL('/en/premier-post/');
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);
  });

  test('on English pages, it is labelled in English', async ({ page }) => {
    await page.goto('/en/');

    await page.getByRole('button', { name: 'Switch to daylight' }).click();
    await expect(badge(page)).toHaveCSS('background-color', card.pleinSoleil);

    await page.getByRole('button', { name: 'Switch to dusk' }).click();
    await expect(badge(page)).toHaveCSS('background-color', card.crepuscule);
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

for (const [theme, colorScheme] of [
  ['crépuscule', 'dark'],
  ['plein soleil', 'light'],
] as const) {
  test.describe(`in « ${theme} »`, () => {
    test.use({ colorScheme });

    test('the text, links and postcards of every page meet AA contrast', async ({
      page,
    }, testInfo) => {
      const failures: Record<string, LowContrast[]> = {};
      for (const path of await builtPages(testInfo)) {
        await page.goto(path);

        // The hero sits on the sky, whose glow varies across the scene: the
        // header is checked through its navigation and badge only.
        const header = page.getByRole('banner');
        const checked = page
          .getByRole('main')
          .or(page.getByRole('contentinfo'))
          .or(header.getByRole('navigation'))
          .or(header.getByRole('link', { name: 'Dev curieux' }));
        const low = await lowContrastTexts(checked);
        if (low.length > 0) failures[path] = low;
      }
      expect(failures).toEqual({});
    });

    for (const width of [1280, 390]) {
      test(`at ${width}px, every focus ring of every page stands out 3:1 from what lies behind it`, async ({
        page,
      }, testInfo) => {
        // A screenshot per focus stop of every page: about 25 s for 20 pages here.
        test.slow();
        // Still waves: the screenshots compared must differ only by the ring.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const failures: Record<string, WeakFocusRing[]> = {};
        for (const path of await builtPages(testInfo)) {
          await page.setViewportSize({ width, height: 800 });
          await page.goto(path);
          // The whole page in view, so moving the focus never scrolls.
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.setViewportSize({ width, height });
          // Every image in view and loaded: nothing but the ring may change.
          await page.waitForFunction(() => [...document.images].every((image) => image.complete));

          const weak = await weakFocusRings(page);
          if (weak.length > 0) failures[path] = weak;
        }
        expect(failures).toEqual({});
      });
    }
  });
}

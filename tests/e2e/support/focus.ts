import type { Page } from '@playwright/test';
import { contrastRatio, type Rgb } from './colors';

export interface WeakFocusRing {
  /** The focused element: its tag and the start of its text. */
  element: string;
  /** Per direction from the ring's centre, the strongest change it makes. */
  ratios: number[];
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tabs through the whole page and returns every focus indicator that does not
 * stand out from what lies behind it: on each of eight rays from its centre
 * outwards, some pixel must change by a contrast of at least 3:1 from the page
 * with nothing focused (WCAG 1.4.11). A two-tone ring passes as long as one of
 * its tones does, wherever it sits. The viewport must hold the whole page, so
 * focusing never scrolls, and nothing may move on its own.
 */
export async function weakFocusRings(page: Page): Promise<WeakFocusRing[]> {
  await page.evaluate(() => document.fonts.ready);
  const baseline = await page.screenshot({ animations: 'disabled' });
  // Kept in the page, decoded once: each focused screenshot is compared with it.
  await page.evaluate(async (png) => {
    const response = await fetch(`data:image/png;base64,${png}`);
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    Reflect.set(window, 'unfocusedPage', context.getImageData(0, 0, bitmap.width, bitmap.height));
  }, baseline.toString('base64'));

  const weak: WeakFocusRing[] = [];
  for (let step = 0; step < 200; step++) {
    await page.keyboard.press('Tab');
    const target = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused || focused === document.body) return null;
      // The ring may be drawn by an ancestor (`:focus-within`).
      let holder: Element = focused;
      while (getComputedStyle(holder).outlineStyle === 'none' && holder.parentElement) {
        holder = holder.parentElement;
      }
      const { x, y, width, height } = holder.getBoundingClientRect();
      const text = (focused.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return {
        element: `${focused.tagName.toLowerCase()} « ${text} »`,
        box: { x, y, width, height },
      };
    });
    if (!target) break;

    const clip = around(target.box, page.viewportSize()!);
    const focused = await page.screenshot({ clip, animations: 'disabled' });
    // Per ray, each pixel focused and unfocused.
    const rays: [Rgb, Rgb][][] = await page.evaluate(
      async ({ png, area, box }) => {
        const response = await fetch(`data:image/png;base64,${png}`);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0);
        const after = context.getImageData(0, 0, bitmap.width, bitmap.height);
        const before = Reflect.get(window, 'unfocusedPage') as ImageData;

        // Runs in the page: its helpers must live inside it.
        // oxlint-disable-next-line unicorn/consistent-function-scoping
        const pixel = ({ data }: ImageData, i: number): [number, number, number] => [
          data[i]!,
          data[i + 1]!,
          data[i + 2]!,
        ];

        const centre = { x: box.x + box.width / 2 - area.x, y: box.y + box.height / 2 - area.y };
        const directions = [
          [1, 0],
          [1, 1],
          [0, 1],
          [-1, 1],
          [-1, 0],
          [-1, -1],
          [0, -1],
          [1, -1],
        ] as const;
        return directions.map(([dx, dy]) => {
          const ray: [[number, number, number], [number, number, number]][] = [];
          for (let t = 0; ; t++) {
            const px = Math.round(centre.x + dx * t);
            const py = Math.round(centre.y + dy * t);
            if (px < 0 || py < 0 || px >= after.width || py >= after.height) break;
            ray.push([
              pixel(after, (py * after.width + px) * 4),
              pixel(before, ((area.y + py) * before.width + area.x + px) * 4),
            ]);
          }
          return ray;
        });
      },
      { png: focused.toString('base64'), area: clip, box: target.box },
    );
    const ratios = rays.map((ray) => {
      const best = ray.reduce((most, [a, b]) => Math.max(most, contrastRatio(a, b)), 1);
      return Math.round(best * 100) / 100;
    });
    if (ratios.some((ratio) => ratio < 3)) weak.push({ element: target.element, ratios });
  }
  return weak;
}

/** The box with a margin for the ring, in whole pixels, inside the viewport. */
function around(box: Box, viewport: { width: number; height: number }): Box {
  const margin = 16;
  const x = Math.max(0, Math.floor(box.x - margin));
  const y = Math.max(0, Math.floor(box.y - margin));
  return {
    x,
    y,
    width: Math.min(viewport.width, Math.ceil(box.x + box.width + margin)) - x,
    height: Math.min(viewport.height, Math.ceil(box.y + box.height + margin)) - y,
  };
}

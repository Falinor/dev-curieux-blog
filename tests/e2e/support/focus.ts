import type { Page } from '@playwright/test';

export interface WeakFocusRing {
  /** The focused element: its tag and the start of its text. */
  element: string;
  /** Per direction from the ring's centre, the strongest change it makes. */
  ratios: number[];
}

/**
 * Tabs through the whole page and returns every focus indicator that does not
 * stand out from what lies behind it: on each of eight rays from its centre
 * outwards, some pixel must change by a contrast of at least 3:1 between the
 * focused and unfocused page (WCAG 1.4.11). A two-tone ring passes as long as
 * one of its tones does, wherever it sits. The viewport must hold the whole
 * page, so focusing never scrolls.
 */
export async function weakFocusRings(page: Page): Promise<WeakFocusRing[]> {
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

    const margin = 16;
    const viewport = page.viewportSize()!;
    const x = Math.max(0, Math.floor(target.box.x - margin));
    const y = Math.max(0, Math.floor(target.box.y - margin));
    const clip = {
      x,
      y,
      width: Math.min(viewport.width, Math.ceil(target.box.x + target.box.width + margin)) - x,
      height: Math.min(viewport.height, Math.ceil(target.box.y + target.box.height + margin)) - y,
    };
    const focused = await page.screenshot({ clip, animations: 'disabled' });
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    const unfocused = await page.screenshot({ clip, animations: 'disabled' });

    const centre = {
      x: target.box.x + target.box.width / 2 - clip.x,
      y: target.box.y + target.box.height / 2 - clip.y,
    };
    const ratios = await page.evaluate(
      async ({ pngs, from }) => {
        const [after, before] = await Promise.all(
          pngs.map(async (png) => {
            const response = await fetch(`data:image/png;base64,${png}`);
            const bitmap = await createImageBitmap(await response.blob());
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const context = canvas.getContext('2d')!;
            context.drawImage(bitmap, 0, 0);
            return context.getImageData(0, 0, bitmap.width, bitmap.height);
          }),
        );

        // Runs in the page: its helpers must live inside it.
        // oxlint-disable-next-line unicorn/consistent-function-scoping
        const luminance = (data: Uint8ClampedArray, i: number) => {
          const [r, g, b] = [data[i]!, data[i + 1]!, data[i + 2]!].map((c) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          }) as [number, number, number];
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

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
          let best = 1;
          for (let t = 0; ; t++) {
            const px = Math.round(from.x + dx * t);
            const py = Math.round(from.y + dy * t);
            if (px < 0 || py < 0 || px >= after!.width || py >= after!.height) break;
            const i = (py * after!.width + px) * 4;
            const [a, b] = [luminance(after!.data, i), luminance(before!.data, i)];
            best = Math.max(best, (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
          }
          return Math.round(best * 100) / 100;
        });
      },
      { pngs: [focused.toString('base64'), unfocused.toString('base64')], from: centre },
    );
    if (ratios.some((ratio) => ratio < 3)) weak.push({ element: target.element, ratios });
  }
  return weak;
}

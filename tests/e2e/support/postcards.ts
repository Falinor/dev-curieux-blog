import type { Page } from '@playwright/test';

export interface Postcard {
  title: string;
  /** Layout box, ignoring the tilt: cards on the same row share `top`. */
  top: number;
  width: number;
  /** True when the card spans the whole grid, as a postcard in the top slot does. */
  spansGrid: boolean;
}

/**
 * The home page's postcards, in reading order, with where they sit in the grid.
 * The list is the region named « Dernières nouvelles », or « Latest news » in English.
 */
export async function homePostcards(
  page: Page,
  region: 'Dernières nouvelles' | 'Latest news' = 'Dernières nouvelles',
): Promise<Postcard[]> {
  const list = page.getByRole('region', { name: region }).getByRole('list');
  return list.evaluate((grid) =>
    [...grid.children].map((card) => {
      const box = card as HTMLElement;
      return {
        title: box.querySelector('h3')?.textContent?.trim() ?? '',
        top: box.offsetTop,
        width: box.offsetWidth,
        spansGrid: box.offsetWidth === grid.clientWidth,
      };
    }),
  );
}

/** Titles grouped by the row they sit on. */
export function rows(cards: Postcard[]): string[][] {
  const byTop = Map.groupBy(cards, (card) => card.top);
  return [...byTop.values()].map((row) => row.map((card) => card.title));
}

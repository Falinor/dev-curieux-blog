import type { Locator, Page } from '@playwright/test';

/** A postcard as the reader sees it: its title, and where it sits. */
export interface PostcardBox {
  title: string;
  /** Layout box, ignoring the tilt: cards on the same row share `top`. */
  top: number;
  width: number;
  /** True when the card spans the whole grid, as a postcard in the top slot does. */
  spansGrid: boolean;
}

/** The postcards of a grid (a list of postcards), in reading order, with where they sit. */
export function postcards(grid: Locator): Promise<PostcardBox[]> {
  return grid.evaluate((list) =>
    [...list.children].map((card) => {
      const box = card as HTMLElement;
      return {
        title: box.querySelector('h2, h3')?.textContent?.trim() ?? '',
        top: box.offsetTop,
        width: box.offsetWidth,
        spansGrid: box.offsetWidth === list.clientWidth,
      };
    }),
  );
}

/**
 * The home page's postcards. The list is the region named « Dernières
 * nouvelles », or « Latest news » in English.
 */
export function homePostcards(
  page: Page,
  region: 'Dernières nouvelles' | 'Latest news' = 'Dernières nouvelles',
): Promise<PostcardBox[]> {
  return postcards(page.getByRole('region', { name: region }).getByRole('list'));
}

/** Titles grouped by the row they sit on. */
export function rows(cards: PostcardBox[]): string[][] {
  const byTop = Map.groupBy(cards, (card) => card.top);
  return [...byTop.values()].map((row) => row.map((card) => card.title));
}

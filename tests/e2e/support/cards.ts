import type { Locator } from '@playwright/test';

/** How a tactile card is drawn: its outline, hard shadow, fill and box on the page. */
export interface Card {
  /** `<width> <style> <color>` of the top border, e.g. `3px solid rgb(6, 3, 13)`. */
  outline: string;
  shadow: string;
  background: string;
  transform: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * The card an element is drawn on: the element itself or its nearest ancestor
 * with a shadow. Null when nothing around it casts a shadow.
 */
export function cardAround(element: Locator): Promise<Card | null> {
  return element.evaluate((node) => {
    for (let box: Element | null = node; box; box = box.parentElement) {
      const style = getComputedStyle(box);
      if (style.boxShadow === 'none') continue;
      const { top, bottom, left, right } = box.getBoundingClientRect();
      return {
        outline: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
        shadow: style.boxShadow,
        background: style.backgroundColor,
        transform: style.transform,
        top,
        bottom,
        left,
        right,
      };
    }
    return null;
  });
}

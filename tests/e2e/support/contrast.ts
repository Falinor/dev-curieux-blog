import type { Locator } from '@playwright/test';
import { contrastRatio } from './colors';

export interface LowContrast {
  text: string;
  ratio: number;
  /** WCAG AA: 4.5, or 3 for large text (24px, or 18.66px bold). */
  required: number;
}

/**
 * Every visible text inside `containers` whose contrast with what lies behind
 * it is below WCAG AA. Behind a text is the first opaque background up its
 * ancestors, under any translucent ones; on a gradient, every color stop counts,
 * as the text may sit on any of them.
 */
export async function lowContrastTexts(containers: Locator): Promise<LowContrast[]> {
  const found = await containers.evaluateAll((roots) => {
    type Rgba = [number, number, number, number];

    // Runs in the page: its helpers must live inside it.
    // oxlint-disable-next-line unicorn/consistent-function-scoping
    function parse(color: string): Rgba {
      const rgb = color.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/);
      if (rgb) return [+rgb[1]!, +rgb[2]!, +rgb[3]!, rgb[4] === undefined ? 1 : +rgb[4]];
      const srgb = color.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
      if (srgb) {
        const alpha = srgb[4] === undefined ? 1 : +srgb[4];
        return [+srgb[1]! * 255, +srgb[2]! * 255, +srgb[3]! * 255, alpha];
      }
      throw new Error(`Unsupported color: ${color}`);
    }

    const over = ([r, g, b, a]: Rgba, [R, G, B]: Rgba): Rgba => [
      r * a + R * (1 - a),
      g * a + G * (1 - a),
      b * a + B * (1 - a),
      1,
    ];

    /** The colors a text may sit on, from its element up. */
    function backdrops(element: Element): Rgba[] {
      const translucent: Rgba[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        const stops = style.backgroundImage.match(/(rgba?|color)\([^)]*\)/g);
        const surface = stops ? stops.map(parse) : [parse(style.backgroundColor)];
        if (surface.every(([, , , a]) => a === 1)) {
          return surface.map((color) =>
            translucent.reduceRight((under, layer) => over(layer, under), color),
          );
        }
        if (!stops && surface[0]![3] > 0) translucent.push(surface[0]!);
      }
      return [[255, 255, 255, 1]];
    }

    const texts = roots.flatMap((root) => [root, ...root.querySelectorAll('*')]);
    return texts.flatMap((element) => {
      const ownText = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();
      if (!ownText || !element.checkVisibility() || element.getBoundingClientRect().width < 2) {
        return [];
      }
      const style = getComputedStyle(element);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && +style.fontWeight >= 700);
      const color = parse(style.color);
      return [{ text: ownText, color, backdrops: backdrops(element), required: large ? 3 : 4.5 }];
    });
  });
  return found.flatMap(({ text, color, backdrops, required }) => {
    const worst = Math.min(...backdrops.map((backdrop) => contrastRatio(color, backdrop)));
    const ratio = Math.round(worst * 100) / 100;
    return ratio < required ? [{ text, ratio, required }] : [];
  });
}

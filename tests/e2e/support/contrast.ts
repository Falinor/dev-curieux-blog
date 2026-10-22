import type { Locator } from '@playwright/test';

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

    function luminance([r, g, b]: Rgba): number {
      const [R, G, B] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      }) as [number, number, number];
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    const ratio = (a: Rgba, b: Rgba) => {
      const [la, lb] = [luminance(a), luminance(b)];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };

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
      const worst = Math.min(...backdrops(element).map((backdrop) => ratio(color, backdrop)));
      return [{ text: ownText, ratio: Math.round(worst * 100) / 100, required: large ? 3 : 4.5 }];
    });
  });
  return found.filter(({ ratio, required }) => ratio < required);
}

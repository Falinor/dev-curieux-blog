// WCAG 2 color contrast, for the checks that compare what the page draws.

/** A color's red, green and blue channels, 0 to 255; an alpha after them is ignored. */
export type Rgb = readonly [number, number, number, ...number[]];

/** The relative luminance of an sRGB color, from 0 (black) to 1 (white). */
export function relativeLuminance([r, g, b]: Rgb): number {
  const [R, G, B] = [r, g, b].map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** The contrast ratio of two colors, from 1 (the same) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

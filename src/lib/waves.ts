// The sea's three outlined waves, back to front, as SVG paths: the scene at the
// top of every page draws them (`components/Waves.astro`), and so does each
// social image.

/** The view box of each wave: twice as wide as a 1200px scene. */
export const waveBox = { width: 2400, height: 90 };

/** A closed wave shape: a curve of `wavelength` around `baseline`, filled below. */
function wave(baseline: number, amplitude: number, wavelength: number): string {
  const { width, height } = waveBox;
  // Quadratic segments: the control point sits twice the amplitude off the
  // baseline, and `T` mirrors it for the next half wavelength.
  let curve = `Q${wavelength / 4} ${baseline - 2 * amplitude} ${wavelength / 2} ${baseline}`;
  for (let x = wavelength; x <= width; x += wavelength / 2) curve += ` T${x} ${baseline}`;
  // The sides and bottom run just outside the view box, so their outline is clipped.
  return `M-4 ${height + 4} L-4 ${baseline} L0 ${baseline} ${curve} L${width + 4} ${baseline} L${width + 4} ${height + 4} Z`;
}

/**
 * Back to front, each with the color token that fills it. The curve repeats
 * every half width (`wavelength` divides `width / 2`), so a wave slid by half
 * its width loops without a seam.
 */
export const waves = [
  { name: 'back', fill: 'sea-4', d: wave(34, 7, 300) },
  { name: 'middle', fill: 'sea-3', d: wave(52, 9, 400) },
  { name: 'front', fill: 'sea-2', d: wave(70, 5, 600) },
] as const;

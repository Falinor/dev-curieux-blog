// Frontmatter dates are UTC midnight: format them in UTC so a machine west of
// Greenwich doesn't show the day before.
const longFrench = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' });

/** A date as French prose: « 15 septembre 2026 », « 1er octobre 2026 ». */
export function formatDate(date: Date): string {
  const text = longFrench.format(date);
  return date.getUTCDate() === 1 ? text.replace(/^1 /, '1er ') : text;
}

/** A date as `YYYY-MM-DD`, for `<time datetime>`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

import { type Locale, languageTags } from './i18n';

/**
 * A date as prose: « 15 septembre 2026 », « 1er octobre 2026 » in French,
 * "1 October 2026" in English.
 */
export function formatDate(date: Date, locale: Locale): string {
  // Frontmatter dates are UTC midnight: format them in UTC so a machine west of
  // Greenwich doesn't show the day before.
  const long = { dateStyle: 'long', timeZone: 'UTC' } as const;
  const text = new Intl.DateTimeFormat(languageTags[locale], long).format(date);
  return locale === 'fr' && date.getUTCDate() === 1 ? text.replace(/^1 /, '1er ') : text;
}

/** A date as `YYYY-MM-DD`, for `<time datetime>`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

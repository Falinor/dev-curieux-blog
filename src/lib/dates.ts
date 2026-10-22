import type { Locale } from './i18n';

// Frontmatter dates are UTC midnight: format them in UTC so a machine west of
// Greenwich doesn't show the day before.
const long: Record<Locale, Intl.DateTimeFormat> = {
  fr: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }),
  en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }),
};

/**
 * A date as prose: « 15 septembre 2026 », « 1er octobre 2026 » in French,
 * "1 October 2026" in English.
 */
export function formatDate(date: Date, locale: Locale): string {
  const text = long[locale].format(date);
  return locale === 'fr' && date.getUTCDate() === 1 ? text.replace(/^1 /, '1er ') : text;
}

/** A date as `YYYY-MM-DD`, for `<time datetime>`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

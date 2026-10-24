// The blog's two languages: French at the root, English under `/en/` (the
// `i18n` config in astro.config.mjs). Every page path is built here, so both
// languages and every list, feed and alternate link agree on the URLs.

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

/** The language of the page being built, from `Astro.currentLocale`. */
export function pageLocale(currentLocale: string | undefined): Locale {
  return currentLocale === 'en' ? 'en' : 'fr';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'fr' ? 'en' : 'fr';
}

const root: Record<Locale, string> = { fr: '/', en: '/en/' };

/** The home page: `/` or `/en/`. */
export function homePath(locale: Locale): string {
  return root[locale];
}

/** A Post's page: `/<slug>/`, or its Translation's, `/en/<slug>/`. */
export function postPath(locale: Locale, slug: string): string {
  return `${root[locale]}${slug}/`;
}

/** A Tag's page: `/tags/<id>/` or `/en/tags/<id>/`. */
export function tagPath(locale: Locale, tagId: string): string {
  return `${root[locale]}tags/${tagId}/`;
}

/** The RSS feed: `/rss.xml` or `/en/rss.xml`. */
export function feedPath(locale: Locale): string {
  return `${root[locale]}rss.xml`;
}

/**
 * The paths of one page in both languages, when it exists in both: a Post
 * with a Translation, a home page, a Tag page. A page with no counterpart (a
 * Post without a Translation, the 404 page) has none.
 */
export type Alternates = Record<Locale, string>;

/** The words around the content, in each language. */
export const ui = {
  fr: {
    /** The name of the language, written in it: the language switch's label. */
    languageName: 'Français',
    navigation: 'Navigation principale',
    home: {
      title: 'Dev curieux — le blog',
      // The highlighted word names the blog.
      heading: ['Cartes postales d’un dev ', 'curieux', ''],
      bio: 'Développeur fullstack freelance. Je construis, j’apprends, et j’écris ce que je découvre.',
      posts: 'Dernières nouvelles',
    },
    readingTime: (minutes: number) => `${minutes} min de lecture`,
    published: 'Publié le',
    updated: 'Mis à jour le',
    react: {
      id: 'reagir',
      heading: 'Réagir',
      prompt: 'Une remarque, une erreur, une idée ? Écrivez-moi.',
    },
    noPosts: 'Aucun Post pour l’instant.',
    legalNotice: 'Mentions légales',
    privacy: 'Confidentialité',
    tagline: 'codé au rythme des marées',
  },
  en: {
    languageName: 'English',
    navigation: 'Main navigation',
    home: {
      title: 'Dev curieux — the blog',
      heading: ['Postcards from a ', 'curious', ' dev'],
      bio: 'Freelance fullstack developer. I build, I learn, and I write down what I find.',
      posts: 'Latest news',
    },
    readingTime: (minutes: number) => `${minutes} min read`,
    // On every English Post page: a Translation is machine-made (ADR 0002).
    notice: {
      text: 'This post was machine-translated from French.',
      link: 'Read the original',
    },
    published: 'Published on',
    updated: 'Updated on',
    react: {
      id: 'reply',
      heading: 'Reply',
      prompt: 'A remark, a mistake, an idea? Write to me.',
    },
    noPosts: 'No posts yet.',
    legalNotice: 'Legal notice',
    privacy: 'Privacy',
    tagline: 'coded to the rhythm of the tides',
  },
} as const satisfies Record<Locale, unknown>;

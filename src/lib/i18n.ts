// The blog's two languages: French at the root, English under `/en/` (the
// `i18n` config in astro.config.mjs). Every page path is built here, so both
// languages and every list, feed and alternate link agree on the URLs.

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
/** The language Posts are written in, served at the root. */
export const defaultLocale: Locale = 'fr';

/**
 * Each language with its region, as a BCP 47 tag, for dates and link
 * previews: French from France, British English.
 */
export const languageTags: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

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
 * A page's social image, the 1200×630 PNG link previews show: next to the page,
 * `<page path>og.png` (`/premier-post/og.png`, `/en/og.png`). Post pages have
 * their own; every other page shows its language's home page image. The
 * `og.png.ts` endpoints next to the pages draw them (`lib/social-image.ts`).
 */
export function socialImagePath(pagePath: string): string {
  return `${pagePath}og.png`;
}

/** Every social image's size, in pixels: what link previews expect. */
export const socialImageSize = { width: 1200, height: 630 };

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
    /** The theme toggle names the theme it switches to, after a hidden verb. */
    theme: {
      toLight: { action: 'Passer en', name: 'plein soleil' },
      toDark: { action: 'Passer au', name: 'crépuscule' },
    },
    home: {
      title: 'Dev curieux — le blog',
      /** The home page's and the feed's description, for search engines and feed readers. */
      description:
        'Le blog de Dev curieux, développeur fullstack freelance : ce que je construis, ce que j’apprends, et pourquoi.',
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
    tag: {
      title: (label: string) => `Posts sur ${label} — Dev curieux`,
      description: (label: string) =>
        `Tous les Posts de Dev curieux sur ${label}, du plus récent au plus ancien.`,
    },
    legalNotice: 'Mentions légales',
    privacy: 'Confidentialité',
    tagline: 'codé au rythme des marées',
    /** The 404 page, in French only: one page answers every unknown URL. */
    notFound: {
      title: 'Page introuvable — Dev curieux',
      // The post office's rubber stamp on mail it can't deliver.
      postmark: 'N’habite pas à l’adresse indiquée',
      heading: 'Cette page a pris le large',
      lead: 'Je ne trouve rien à cette adresse : le lien est peut-être cassé, ou la page a dérivé ailleurs.',
      home: 'Retour à l’accueil',
    },
  },
  en: {
    languageName: 'English',
    navigation: 'Main navigation',
    theme: {
      toLight: { action: 'Switch to', name: 'daylight' },
      toDark: { action: 'Switch to', name: 'dusk' },
    },
    home: {
      title: 'Dev curieux — the blog',
      description:
        'The blog of Dev curieux, a freelance fullstack developer: what I build, what I learn, and why.',
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
    tag: {
      title: (label: string) => `Posts about ${label} — Dev curieux`,
      description: (label: string) => `Every post by Dev curieux about ${label}, newest first.`,
    },
    legalNotice: 'Legal notice',
    privacy: 'Privacy',
    tagline: 'coded to the rhythm of the tides',
  },
} as const satisfies Record<Locale, unknown>;

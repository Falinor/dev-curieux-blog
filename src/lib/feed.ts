import rss from '@astrojs/rss';
import { feedPath, homePath, type Locale, postPath, ui } from './i18n';
import { getPostsIn, getTagLabels } from './posts';

/**
 * The RSS feed of a language (`feedPath()`): the Posts its pages show, newest
 * first, so the Translations in English and never a Draft. An item links to
 * the Post's page and carries its Tags' labels in that language.
 */
export async function feed(locale: Locale, site: URL | undefined): Promise<Response> {
  if (!site) throw new Error('The feeds need `site` in astro.config.mjs.');
  const items = await Promise.all(
    (await getPostsIn(locale)).map(async (view) => ({
      title: view.entry.data.title,
      description: view.entry.data.description,
      pubDate: view.post.data.publishedAt,
      link: new URL(postPath(locale, view.post.id), site).href,
      categories: await getTagLabels(view),
    })),
  );
  const self = new URL(feedPath(locale), site).href;
  return rss({
    title: ui[locale].home.title,
    description: ui[locale].home.description,
    site: new URL(homePath(locale), site),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>${locale}</language><atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
    items,
  });
}

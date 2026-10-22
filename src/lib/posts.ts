import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

export type Post = CollectionEntry<'posts'>;
export type Tag = CollectionEntry<'tags'>;
export type Translation = CollectionEntry<'translations'>;

/**
 * A Post as the pages of one language show it. Its title, description and
 * body come from `text`: the Post itself in French, its Translation in English.
 * Dates, Tags, `draft` and `pinned` always come from `post`.
 */
export interface PostView {
  locale: Locale;
  post: Post;
  /** The entry readers read: pass it to `render()` for the body. */
  text: Post | Translation;
}

/** Every Post readers may see, newest first. Drafts are left out. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (post) => !post.data.draft);
  return posts.toSorted((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

/**
 * The Posts the pages of a language show, newest first: every published Post
 * in French; in English, only those with a Translation. An English page never
 * falls back to French content.
 */
export async function getPostsIn(locale: Locale): Promise<PostView[]> {
  const posts = await getPublishedPosts();
  if (locale === 'fr') return posts.map((post) => ({ locale, post, text: post }));
  const translations = new Map(
    (await getCollection('translations')).map((translation) => [translation.id, translation]),
  );
  return posts.flatMap((post) => {
    const translation = translations.get(post.id);
    return translation ? [{ locale, post, text: translation }] : [];
  });
}

/**
 * Every Tag, with the Posts of a language that carry it, newest first. Every
 * Tag gets a page in both languages, even with no Post yet (or only Drafts), so
 * every Tag page has its counterpart in the other language.
 */
export async function getTagsIn(locale: Locale): Promise<{ tag: Tag; views: PostView[] }[]> {
  const [tags, views] = await Promise.all([getCollection('tags'), getPostsIn(locale)]);
  return tags.map((tag) => ({
    tag,
    views: views.filter(({ post }) => post.data.tags.some(({ id }) => id === tag.id)),
  }));
}

/**
 * How a home page lays out Posts (already newest first, as `getPostsIn()`
 * returns them): the Pinned Posts are featured at the top, or the most recent
 * Post when nothing is pinned; the others follow.
 */
export function homeLayout(views: PostView[]): { featured: PostView[]; others: PostView[] } {
  const pinned = views.filter(({ post }) => post.data.pinned);
  const featured = pinned.length > 0 ? pinned : views.slice(0, 1);
  return { featured, others: views.filter((view) => !featured.includes(view)) };
}

/** The Post's Tags in frontmatter order: the first one is the Post's stamp. */
export async function getPostTags(post: Post): Promise<Tag[]> {
  return getEntries(post.data.tags);
}

const wordsPerMinute = 200;

/**
 * Minutes needed to read an MDX body (a Post's `body`, or a Translation's), at
 * least 1. MDX `import`/`export` lines and tags are not counted as words.
 */
export function readingMinutes(body: string | undefined): number {
  const words =
    (body ?? '')
      .replace(/^\s*(import|export)\s.*$/gm, '')
      .replace(/<[^>]+>/g, ' ')
      .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

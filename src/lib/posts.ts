import { getCollection, getEntries, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Tag = CollectionEntry<'tags'>;

/** Every Post readers may see, newest first. Drafts are left out. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (post) => !post.data.draft);
  return posts.toSorted((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

/**
 * How the home page lays out Posts (already newest first, as
 * `getPublishedPosts()` returns them): the Pinned Posts are featured at the top,
 * or the most recent Post when nothing is pinned; the others follow.
 */
export function homeLayout(posts: Post[]): { featured: Post[]; others: Post[] } {
  const pinned = posts.filter((post) => post.data.pinned);
  const featured = pinned.length > 0 ? pinned : posts.slice(0, 1);
  return { featured, others: posts.filter((post) => !featured.includes(post)) };
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

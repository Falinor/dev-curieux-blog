import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Every Post readers may see: Drafts are left out. */
export async function getPublishedPosts(): Promise<Post[]> {
  return getCollection('posts', (post) => !post.data.draft);
}

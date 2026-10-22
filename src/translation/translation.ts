// The Translation module (ADR 0002): everything deterministic about Translations.
// Runs under plain Node (no `astro:*` imports): the pre-commit hook and CI call it.
import { glob } from 'node:fs/promises';
import { join } from 'node:path';

export type TranslationState = 'fresh' | 'stale' | 'missing';

/** A non-Draft Post and the state of its Translation. */
export interface PostTranslation {
  /** The Post's file name without `.mdx`. */
  slug: string;
  /** Path of the French Post file. */
  post: string;
  /** Path of its Translation file, `<slug>.en.mdx` next to the Post (may not exist yet). */
  translation: string;
  status: TranslationState;
}

/** Every non-Draft Post under `<contentDir>/posts/`, by slug, with its Translation's state. */
export async function translationStatus(contentDir: string): Promise<PostTranslation[]> {
  const postsDir = join(contentDir, 'posts');
  const statuses: PostTranslation[] = [];
  for await (const name of glob('*.mdx', { cwd: postsDir })) {
    const slug = name.slice(0, -'.mdx'.length);
    statuses.push({
      slug,
      post: join(postsDir, name),
      translation: join(postsDir, `${slug}.en.mdx`),
      status: 'missing',
    });
  }
  return statuses;
}

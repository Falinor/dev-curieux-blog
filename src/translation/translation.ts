// The Translation module (ADR 0002): everything deterministic about Translations.
// Runs under plain Node (no `astro:*` imports): the pre-commit hook and CI call it.
import { createHash } from 'node:crypto';
import { glob, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

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

const TRANSLATION_SUFFIX = '.en.mdx';

/** Every non-Draft Post under `<contentDir>/posts/`, by slug, with its Translation's state. */
export async function translationStatus(contentDir: string): Promise<PostTranslation[]> {
  const postsDir = join(contentDir, 'posts');
  const statuses: PostTranslation[] = [];
  // A pattern list: an `exclude` function is never called for these files (Node 24.22).
  for await (const name of glob('*.mdx', { cwd: postsDir, exclude: [`*${TRANSLATION_SUFFIX}`] })) {
    const post = join(postsDir, name);
    const source = await readFile(post);
    if (frontmatter(source.toString('utf8')).draft === true) continue;
    const slug = name.slice(0, -'.mdx'.length);
    const translation = join(postsDir, `${slug}${TRANSLATION_SUFFIX}`);
    statuses.push({ slug, post, translation, status: await stateOf(source, translation) });
  }
  return statuses;
}

async function stateOf(source: Buffer, translation: string): Promise<TranslationState> {
  const translated = await readIfExists(translation);
  if (translated === undefined) return 'missing';
  return frontmatter(translated).sourceHash === fingerprint(source) ? 'fresh' : 'stale';
}

// The fingerprint of a Post: SHA-256 of the file's exact bytes, frontmatter included,
// so any change (even the title alone) makes its Translation stale.
function fingerprint(post: Buffer): string {
  return createHash('sha256').update(post).digest('hex');
}

function frontmatter(text: string): Record<string, unknown> {
  const fence = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  return (fence && parse(fence[1])) ?? {};
}

async function readIfExists(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

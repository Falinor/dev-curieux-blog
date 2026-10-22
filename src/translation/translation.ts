// The Translation module (ADR 0002): everything deterministic about Translations.
// Runs under plain Node (no `astro:*` imports): the pre-commit hook and CI call it.
import { createHash } from 'node:crypto';
import { glob, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

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

/** What a translator returns for a Post: its English title, description and MDX body. */
export interface English {
  title: string;
  description: string;
  body: string;
}

/**
 * The translator adapter: takes a French Post file's full contents and returns its
 * English, or `{ unavailable: reason }` when it cannot translate (never throws for that).
 */
export type Translator = (frenchPost: string) => Promise<English | { unavailable: string }>;

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

/**
 * Sends every stale or missing Post to the translator and writes its Translation,
 * carrying the Post's current fingerprint as `sourceHash`. Drafts and fresh Posts
 * are skipped.
 */
export async function translatePosts(
  translator: Translator,
  { contentDir }: { contentDir: string },
): Promise<void> {
  for (const { post, translation, status } of await translationStatus(contentDir)) {
    if (status === 'fresh') continue;
    const source = await readFile(post);
    const english = await translator(source.toString('utf8'));
    if ('unavailable' in english) continue;
    await writeFile(translation, translationFile(english, fingerprint(source)));
  }
}

// A Translation holds only the translated fields and its Post's fingerprint: dates,
// Tags, `draft` and `pinned` are always read from the Post.
function translationFile({ title, description, body }: English, sourceHash: string): string {
  const fields = stringify({ title, description, sourceHash }, { lineWidth: 0 });
  return `---\n${fields}---\n\n${body.trim()}\n`;
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

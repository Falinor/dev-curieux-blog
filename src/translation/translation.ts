// The Translation module (ADR 0002): everything deterministic about Translations.
// Runs under plain Node (no `astro:*` imports): the pre-commit hook and CI call it.
import { createHash } from 'node:crypto';
import { glob, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';

export type TranslationStatus = 'fresh' | 'stale' | 'missing';

/** A non-Draft Post and the status of its Translation. */
export interface PostTranslation {
  /** The Post's file name without `.mdx`. */
  slug: string;
  /** Path of the French Post file. */
  postPath: string;
  /** Path of its Translation file, `<slug>.en.mdx` next to the Post (may not exist yet). */
  translationPath: string;
  status: TranslationStatus;
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

/** What `translatePosts` did; each Post keeps the status it had before translating. */
export interface TranslationReport {
  /** Posts whose Translation was written. */
  translated: PostTranslation[];
  /** Posts whose Translation was already fresh, so not sent to the translator. */
  fresh: PostTranslation[];
  /** Posts left untouched because the translator was unavailable: a warning, not an error. */
  unavailable: (PostTranslation & { reason: string })[];
}

const TRANSLATION_SUFFIX = '.en.mdx';

/** Every non-Draft Post under `<contentDir>/posts/`, by slug, with its Translation's status. */
export async function translationStatus(contentDir: string): Promise<PostTranslation[]> {
  const posts = await Promise.all((await postFiles(contentDir)).map(postTranslation));
  return posts.filter((post) => post !== undefined);
}

/**
 * Sends every stale or missing Post to the translator and writes its Translation,
 * carrying the Post's current fingerprint as `sourceHash`. Drafts and fresh Posts
 * are skipped. Takes every Post of a content root, or a list of Post files (paths
 * as given, duplicates ignored). When the translator is unavailable for a Post, its
 * files stay as they were and the Post is reported in `unavailable`.
 */
export async function translatePosts(
  translator: Translator,
  from: { contentDir: string } | { posts: string[] },
): Promise<TranslationReport> {
  const report: TranslationReport = { translated: [], fresh: [], unavailable: [] };
  const postPaths = 'posts' in from ? new Set(from.posts) : await postFiles(from.contentDir);
  for (const postPath of postPaths) {
    const target = await postTranslation(postPath);
    if (!target) continue;
    if (target.status === 'fresh') {
      report.fresh.push(target);
      continue;
    }
    const source = await readFile(postPath);
    const english = await translator(source.toString('utf8'));
    if ('unavailable' in english) {
      report.unavailable.push({ ...target, reason: english.unavailable });
      continue;
    }
    await writeFile(target.translationPath, translationFile(english, fingerprint(source)));
    report.translated.push(target);
  }
  return report;
}

async function postFiles(contentDir: string): Promise<string[]> {
  const postsDir = join(contentDir, 'posts');
  // A pattern list: an `exclude` function is never called for these files (Node 24.22).
  const names = await Array.fromAsync(
    glob('*.mdx', { cwd: postsDir, exclude: [`*${TRANSLATION_SUFFIX}`] }),
  );
  return names.toSorted().map((name) => join(postsDir, name));
}

// A Post's Translation (`<slug>.en.mdx` next to it) and its status; undefined for a Draft.
async function postTranslation(postPath: string): Promise<PostTranslation | undefined> {
  const source = await readFile(postPath);
  if (frontmatter(source.toString('utf8')).draft === true) return undefined;
  const slug = basename(postPath, '.mdx');
  const translationPath = join(dirname(postPath), `${slug}${TRANSLATION_SUFFIX}`);
  return { slug, postPath, translationPath, status: await statusOf(source, translationPath) };
}

// A Translation holds only the translated fields and its Post's fingerprint: dates,
// Tags, `draft` and `pinned` are always read from the Post.
function translationFile({ title, description, body }: English, sourceHash: string): string {
  const fields = stringify({ title, description, sourceHash }, { lineWidth: 0 });
  return `---\n${fields}---\n\n${body.trim()}\n`;
}

async function statusOf(source: Buffer, translationPath: string): Promise<TranslationStatus> {
  const translated = await readIfExists(translationPath);
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

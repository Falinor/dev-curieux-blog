import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { translatePosts, translationStatus, type Translator } from './translation.ts';

// A French Post and the SHA-256 of its exact bytes (computed with `sha256sum`).
const PREMIER_POST = `---
title: Premier post
description: Mon premier post.
publishedAt: 2026-09-01
tags: [astro]
---

Bonjour le monde.
`;
const PREMIER_POST_SHA256 = 'be38f3f756bcd1111b1f2eba5e440e2118052dbbb670928d6a6804daeb63d48f';
// The same Post after a title-only change.
const REVISED_POST = PREMIER_POST.replace('title: Premier post', 'title: Premier post, revu');
const REVISED_POST_SHA256 = '8f44f0887a7102ae1efa537ba62cc158b3424ca530b32e9388c9a83007ad8d7a';
const DRAFT_POST = PREMIER_POST.replace('tags: [astro]', 'tags: [astro]\ndraft: true');

// A Translation generated from the Post whose SHA-256 is `sourceHash`.
const translation = (sourceHash: string) => `---
title: First post
description: My first post.
sourceHash: ${sourceHash}
---

Hello world.
`;

// A translator that answers every Post with the English of `translation()`,
// recording the French Posts it was given.
function fakeTranslator(): { translator: Translator; received: string[] } {
  const received: string[] = [];
  const translator: Translator = async (post) => {
    received.push(post);
    return { title: 'First post', description: 'My first post.', body: '\nHello world.\n' };
  };
  return { translator, received };
}

// Why the `claude -p` adapter cannot translate when the `claude` command is missing.
const NOT_INSTALLED = 'the claude command was not found: install Claude Code and log in';

const unavailableTranslator: Translator = async () => ({
  unavailable: 'claude: command not found',
});

// A content root (same layout as `BLOG_CONTENT_DIR`) holding the given files
// under `posts/`, removed after the test.
async function contentRoot(t: TestContext, posts: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'translation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'posts'));
  for (const [name, text] of Object.entries(posts)) {
    await writeFile(join(root, 'posts', name), text);
  }
  return root;
}

const readPost = (root: string, name: string) => readFile(join(root, 'posts', name), 'utf8');

// Every file under `posts/` with its contents.
async function snapshot(root: string): Promise<Record<string, string>> {
  const names = await readdir(join(root, 'posts'));
  return Object.fromEntries(
    await Promise.all(names.map(async (name) => [name, await readPost(root, name)])),
  );
}

// Runs the Translation command line on a content root, as CI, package scripts and
// the pre-commit hook do. `path` replaces PATH, where the command finds `claude`.
function cli(args: string[], contentDir: string, { path = process.env.PATH, cwd = '.' } = {}) {
  const script = join(import.meta.dirname, 'cli.ts');
  return spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, BLOG_CONTENT_DIR: contentDir, PATH: path },
    encoding: 'utf8',
    cwd,
  });
}

// A stand-in for the `claude` command, first on the returned PATH: it records the
// French Post it gets on stdin, prints `output` as `claude -p --output-format json`
// does, and exits with `exitCode`. The real command is never run by tests.
async function fakeClaude(t: TestContext, output: object, exitCode = 0) {
  const bin = await mkdtemp(join(tmpdir(), 'fake-claude-'));
  t.after(() => rm(bin, { recursive: true, force: true }));
  const log = join(bin, 'received.json');
  await writeFile(log, '[]');
  const script = `#!${process.execPath}
const { readFileSync, writeFileSync } = require('node:fs');
const log = ${JSON.stringify(log)};
const received = JSON.parse(readFileSync(log, 'utf8'));
writeFileSync(log, JSON.stringify([...received, readFileSync(0, 'utf8')]));
process.stdout.write(${JSON.stringify(JSON.stringify(output))});
process.exitCode = ${exitCode};
`;
  await writeFile(join(bin, 'claude'), script);
  await chmod(join(bin, 'claude'), 0o755);
  return {
    path: `${bin}${delimiter}${process.env.PATH}`,
    received: async (): Promise<string[]> => JSON.parse(await readFile(log, 'utf8')),
  };
}

// What `claude -p --output-format json --json-schema …` prints when it translated.
const TRANSLATED = {
  type: 'result',
  subtype: 'success',
  is_error: false,
  structured_output: { title: 'First post', description: 'My first post.', body: 'Hello world.' },
};

// An empty directory to use as PATH: no `claude` command, as before installing Claude Code.
async function emptyDir(t: TestContext): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'empty-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('status reports a Post without a Translation as missing', async (t) => {
  const root = await contentRoot(t, { 'premier-post.mdx': PREMIER_POST });

  const statuses = await translationStatus(root);

  assert.deepEqual(
    statuses.map(({ slug, status }) => ({ slug, status })),
    [{ slug: 'premier-post', status: 'missing' }],
  );
});

test('status reports a Translation generated from the current Post as fresh', async (t) => {
  const root = await contentRoot(t, {
    'premier-post.mdx': PREMIER_POST,
    'premier-post.en.mdx': translation(PREMIER_POST_SHA256),
  });

  const statuses = await translationStatus(root);

  assert.deepEqual(
    statuses.map(({ slug, status }) => ({ slug, status })),
    [{ slug: 'premier-post', status: 'fresh' }],
  );
});

test('a title-only change in a Post makes its Translation stale', async (t) => {
  const root = await contentRoot(t, {
    'premier-post.mdx': REVISED_POST,
    'premier-post.en.mdx': translation(PREMIER_POST_SHA256),
  });

  const statuses = await translationStatus(root);

  assert.deepEqual(
    statuses.map(({ slug, status }) => ({ slug, status })),
    [{ slug: 'premier-post', status: 'stale' }],
  );
});

test('status never lists a Draft, with or without a Translation', async (t) => {
  const root = await contentRoot(t, {
    'brouillon.mdx': DRAFT_POST,
    'autre-brouillon.mdx': DRAFT_POST,
    'autre-brouillon.en.mdx': translation(PREMIER_POST_SHA256),
    'premier-post.mdx': PREMIER_POST,
  });

  const statuses = await translationStatus(root);

  assert.deepEqual(
    statuses.map(({ slug }) => slug),
    ['premier-post'],
  );
});

test('translate sends only stale and missing Posts and writes their new fingerprint', async (t) => {
  const root = await contentRoot(t, {
    'deja-traduit.mdx': PREMIER_POST,
    'deja-traduit.en.mdx': translation(PREMIER_POST_SHA256),
    'modifie.mdx': REVISED_POST,
    'modifie.en.mdx': translation(PREMIER_POST_SHA256),
    'nouveau.mdx': PREMIER_POST,
    'brouillon.mdx': DRAFT_POST,
  });
  const { translator, received } = fakeTranslator();

  await translatePosts(translator, { contentDir: root });

  assert.deepEqual(received.toSorted(), [PREMIER_POST, REVISED_POST]);
  assert.equal(await readPost(root, 'nouveau.en.mdx'), translation(PREMIER_POST_SHA256));
  assert.equal(await readPost(root, 'modifie.en.mdx'), translation(REVISED_POST_SHA256));
  assert.equal(await readPost(root, 'deja-traduit.en.mdx'), translation(PREMIER_POST_SHA256));
  assert.deepEqual(
    (await translationStatus(root)).map(({ status }) => status),
    ['fresh', 'fresh', 'fresh'],
  );
});

test('translate given Post files sends only those that are stale or missing, once', async (t) => {
  const root = await contentRoot(t, {
    'nouveau.mdx': PREMIER_POST,
    'pas-demande.mdx': REVISED_POST,
    'deja-traduit.mdx': PREMIER_POST,
    'deja-traduit.en.mdx': translation(PREMIER_POST_SHA256),
    'brouillon.mdx': DRAFT_POST,
  });
  const { translator, received } = fakeTranslator();
  const post = (name: string) => join(root, 'posts', name);

  const report = await translatePosts(translator, {
    posts: [
      post('nouveau.mdx'),
      post('deja-traduit.mdx'),
      post('brouillon.mdx'),
      post('nouveau.mdx'),
    ],
  });

  assert.deepEqual(received, [PREMIER_POST]);
  assert.equal(await readPost(root, 'nouveau.en.mdx'), translation(PREMIER_POST_SHA256));
  assert.deepEqual(
    report.translated.map((written) => written.translation),
    [post('nouveau.en.mdx')],
  );
  assert.deepEqual(
    (await translationStatus(root))
      .map(({ slug, status }) => ({ slug, status }))
      .toSorted((a, b) => a.slug.localeCompare(b.slug)),
    [
      { slug: 'deja-traduit', status: 'fresh' },
      { slug: 'nouveau', status: 'fresh' },
      { slug: 'pas-demande', status: 'missing' },
    ],
  );
});

test('an unavailable translator leaves every file untouched and is reported, not thrown', async (t) => {
  const root = await contentRoot(t, {
    'nouveau.mdx': PREMIER_POST,
    'modifie.mdx': REVISED_POST,
    'modifie.en.mdx': translation(PREMIER_POST_SHA256),
  });
  const before = await snapshot(root);
  const report = await translatePosts(unavailableTranslator, { contentDir: root });

  assert.deepEqual(await snapshot(root), before);
  assert.deepEqual(report.translated, []);
  assert.deepEqual(
    report.unavailable
      .map(({ slug, reason }) => ({ slug, reason }))
      .toSorted((a, b) => a.slug.localeCompare(b.slug)),
    [
      { slug: 'modifie', reason: 'claude: command not found' },
      { slug: 'nouveau', reason: 'claude: command not found' },
    ],
  );
});

test('check exits non-zero naming every Post with a stale or missing Translation', async (t) => {
  const root = await contentRoot(t, {
    'nouveau.mdx': PREMIER_POST,
    'deja-traduit.mdx': PREMIER_POST,
    'deja-traduit.en.mdx': translation(PREMIER_POST_SHA256),
    'modifie.mdx': REVISED_POST,
    'modifie.en.mdx': translation(PREMIER_POST_SHA256),
    'brouillon.mdx': DRAFT_POST,
  });

  const { status, stderr } = cli(['check'], root);

  assert.equal(status, 1);
  assert.equal(
    stderr,
    [
      'Translation check failed. These Posts need a new Translation:',
      `  ${join(root, 'posts', 'modifie.mdx')}: stale`,
      `  ${join(root, 'posts', 'nouveau.mdx')}: missing`,
      '',
    ].join('\n'),
  );
});

test('check exits zero when every non-Draft Post has a fresh Translation', async (t) => {
  const root = await contentRoot(t, {
    'deja-traduit.mdx': PREMIER_POST,
    'deja-traduit.en.mdx': translation(PREMIER_POST_SHA256),
    'brouillon.mdx': DRAFT_POST,
  });

  const { status, stderr } = cli(['check'], root);

  assert.equal(stderr, '');
  assert.equal(status, 0);
});

test('an unknown command exits non-zero instead of passing silently', async (t) => {
  const root = await contentRoot(t, { 'premier-post.mdx': PREMIER_POST });

  assert.equal(cli(['chek'], root).status, 2);
});

test('translate without Claude Code installed exits zero, warning about every untranslated Post', async (t) => {
  const root = await contentRoot(t, {
    'nouveau.mdx': PREMIER_POST,
    'modifie.mdx': REVISED_POST,
    'modifie.en.mdx': translation(PREMIER_POST_SHA256),
    'brouillon.mdx': DRAFT_POST,
  });
  const before = await snapshot(root);

  const { status, stderr } = cli(['translate'], root, { path: await emptyDir(t) });

  assert.equal(status, 0);
  assert.equal(
    stderr,
    [
      'Warning: these Posts were not translated. Run `pnpm translate` once Claude Code works; until then the Translation check fails.',
      `  ${join(root, 'posts', 'modifie.mdx')}: ${NOT_INSTALLED}`,
      `  ${join(root, 'posts', 'nouveau.mdx')}: ${NOT_INSTALLED}`,
      '',
    ].join('\n'),
  );
  assert.deepEqual(await snapshot(root), before);
});

test('translate given Post files writes a Translation for each stale or missing one', async (t) => {
  const root = await contentRoot(t, {
    'nouveau.mdx': PREMIER_POST,
    'deja-traduit.mdx': PREMIER_POST,
    'deja-traduit.en.mdx': translation(PREMIER_POST_SHA256),
    'brouillon.mdx': DRAFT_POST,
  });
  const claude = await fakeClaude(t, TRANSLATED);
  const post = (name: string) => join(root, 'posts', name);

  const { status, stdout } = cli(
    ['translate', post('nouveau.mdx'), post('deja-traduit.mdx'), post('brouillon.mdx')],
    root,
    { path: claude.path },
  );

  assert.equal(status, 0);
  assert.deepEqual(await claude.received(), [PREMIER_POST]);
  assert.equal(await readPost(root, 'nouveau.en.mdx'), translation(PREMIER_POST_SHA256));
  assert.equal(stdout, `Translated ${post('nouveau.mdx')} into ${post('nouveau.en.mdx')}\n`);
  assert.deepEqual((await readdir(join(root, 'posts'))).toSorted(), [
    'brouillon.mdx',
    'deja-traduit.en.mdx',
    'deja-traduit.mdx',
    'nouveau.en.mdx',
    'nouveau.mdx',
  ]);
});

test('translate when Claude Code is not logged in warns with its message and writes nothing', async (t) => {
  const root = await contentRoot(t, { 'nouveau.mdx': PREMIER_POST });
  // What `claude -p --output-format json` prints, with exit code 1, before `/login`.
  const claude = await fakeClaude(
    t,
    {
      type: 'result',
      subtype: 'success',
      is_error: true,
      result: 'Not logged in · Please run /login',
      terminal_reason: 'api_error',
    },
    1,
  );

  const { status, stderr } = cli(['translate'], root, { path: claude.path });

  assert.equal(status, 0);
  assert.match(
    stderr,
    new RegExp(`^  ${RegExp.escape(join(root, 'posts', 'nouveau.mdx'))}: Not logged in`, 'm'),
  );
  assert.deepEqual(await readdir(join(root, 'posts')), ['nouveau.mdx']);
});

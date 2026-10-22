import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  const draft = PREMIER_POST.replace('tags: [astro]', 'tags: [astro]\ndraft: true');
  const root = await contentRoot(t, {
    'brouillon.mdx': draft,
    'autre-brouillon.mdx': draft,
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
    'brouillon.mdx': PREMIER_POST.replace('tags: [astro]', 'tags: [astro]\ndraft: true'),
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
    'brouillon.mdx': PREMIER_POST.replace('tags: [astro]', 'tags: [astro]\ndraft: true'),
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
    report.translated.map(({ translation }) => translation),
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
  const translator: Translator = async () => ({ unavailable: 'claude: command not found' });

  const report = await translatePosts(translator, { contentDir: root });

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

// Every file under `posts/` with its contents.
async function snapshot(root: string): Promise<Record<string, string>> {
  const names = await readdir(join(root, 'posts'));
  return Object.fromEntries(
    await Promise.all(names.map(async (name) => [name, await readPost(root, name)])),
  );
}

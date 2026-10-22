import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { translationStatus } from './translation.ts';

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

// A Translation generated from the Post whose SHA-256 is `sourceHash`.
const translation = (sourceHash: string) => `---
title: First post
description: My first post.
sourceHash: ${sourceHash}
---

Hello world.
`;

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
    'premier-post.mdx': PREMIER_POST.replace('title: Premier post', 'title: Premier post, revu'),
    'premier-post.en.mdx': translation(PREMIER_POST_SHA256),
  });

  const statuses = await translationStatus(root);

  assert.deepEqual(
    statuses.map(({ slug, status }) => ({ slug, status })),
    [{ slug: 'premier-post', status: 'stale' }],
  );
});

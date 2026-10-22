import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { translationStatus } from './translation.ts';

const PREMIER_POST = `---
title: Premier post
description: Mon premier post.
publishedAt: 2026-09-01
tags: [astro]
---

Bonjour le monde.
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

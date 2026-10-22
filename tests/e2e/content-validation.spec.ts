import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';

// Each broken fixture is a content root holding one authoring mistake. Builds in
// this file run one after the other: they share Astro's content cache.
test.describe.configure({ timeout: 120_000 });

async function build(contentDir: string): Promise<{ failed: boolean; output: string }> {
  const outDir = await mkdtemp(join(tmpdir(), 'blog-build-'));
  try {
    await promisify(execFile)('pnpm', ['exec', 'astro', 'build', '--outDir', outDir], {
      env: { ...process.env, BLOG_CONTENT_DIR: contentDir },
    });
    return { failed: false, output: '' };
  } catch (error) {
    const { stdout, stderr } = error as { stdout: string; stderr: string };
    return { failed: true, output: `${stdout}\n${stderr}` };
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}

test('a Post with an unknown Tag fails the build, naming the Post and the Tag', async () => {
  const { failed, output } = await build('tests/fixtures/unknown-tag');

  expect(failed).toBe(true);
  expect(output).toContain('posts → tag-inconnu');
  expect(output).toContain('Unknown Tag "inexistant"');
});

test('a Post missing a required field fails the build, naming the Post and the field', async () => {
  const { failed, output } = await build('tests/fixtures/missing-field');

  expect(failed).toBe(true);
  expect(output).toContain('posts → champ-manquant');
  expect(output).toMatch(/description\W*: .*Required/);
});

test('a misspelled frontmatter field fails the build instead of being ignored', async () => {
  const { failed, output } = await build('tests/fixtures/unknown-field');

  expect(failed).toBe(true);
  expect(output).toContain('posts → cle-mal-ecrite');
  expect(output).toContain('"drafts"');
});

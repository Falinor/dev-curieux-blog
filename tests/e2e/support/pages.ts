import { readdir } from 'node:fs/promises';
import type { TestInfo } from '@playwright/test';

/**
 * The URL of every page the site under test serves: one per HTML file in its
 * build output (`/`, `/<slug>/`, …, and `/404.html`).
 */
export async function builtPages(testInfo: TestInfo): Promise<string[]> {
  const { outDir } = testInfo.project.metadata as { outDir: string };
  const files = await readdir(outDir, { recursive: true });
  return files
    .filter((file) => file.endsWith('.html'))
    .map((file) => `/${file.replace(/index\.html$/, '')}`);
}

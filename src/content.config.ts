import { readFileSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { contentDir } from './lib/content-dir';

const tagsFile = `${contentDir}/tags.json`;

// `reference()` alone only logs an unknown id, so a Post's Tags are first checked
// against the Tag file: an unknown Tag then fails the build, naming the Post.
// `astro dev` reads the file once: restart it after adding a Tag.
const tagIds = new Set(
  (JSON.parse(readFileSync(tagsFile, 'utf8')) as { id: string }[]).map(({ id }) => id),
);
const tagId = z
  .string()
  .refine((id) => tagIds.has(id), {
    error: (issue) => `Unknown Tag "${String(issue.input)}" (Tags are listed in ${tagsFile})`,
  })
  .pipe(reference('tags'));

const tags = defineCollection({
  loader: file(tagsFile),
  schema: z.strictObject({
    // Stable: the id is the Tag page URL in both languages.
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: 'A Tag id is lowercase ASCII letters and digits, words joined by "-"',
    }),
    fr: z.string(),
    en: z.string(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: ['*.mdx', '!*.en.mdx'], base: `${contentDir}/posts` }),
  // Strict: a misspelled field (`drafts: true`) fails the build instead of being
  // dropped, which would publish a Draft.
  schema: z.strictObject({
    title: z.string(),
    // Used for SEO, RSS, social images and postcards.
    description: z.string(),
    // YAML dates (`2026-10-22`) are UTC midnight.
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    // The first Tag is the Post's stamp.
    tags: z.array(tagId).nonempty(),
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    // Reserved for Syndication (out of scope for v1): accepted, never read.
    syndication: z.unknown().optional(),
  }),
});

// A Translation: the English title, description and body of the Post with the
// same slug (`<slug>.en.mdx` next to `<slug>.mdx`, so the body's relative images
// still resolve), written by the Translation module (`src/translation/`, ADR
// 0002). Its id is the Post's slug. `sourceHash` is the fingerprint of the Post
// it was translated from. Everything else (dates, Tags, `draft`, `pinned`) is
// read from the Post.
const translations = defineCollection({
  loader: glob({
    pattern: '*.en.mdx',
    base: `${contentDir}/posts`,
    generateId: ({ entry }) => entry.replace(/\.en\.mdx$/, ''),
  }),
  schema: z.strictObject({
    title: z.string(),
    description: z.string(),
    sourceHash: z.string(),
  }),
});

export const collections = { posts, tags, translations };

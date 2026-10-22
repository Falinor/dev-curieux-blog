import { readFileSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Root of all content. End-to-end tests point it at a fixture directory with the
// same layout: `posts/` holds one `<slug>.mdx` file per Post (its Translation sits
// next to it as `<slug>.en.mdx`), `tags.json` the Tags.
const contentDir = process.env.BLOG_CONTENT_DIR || 'src/content';
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
  schema: z.object({
    id: z.string(),
    fr: z.string(),
    en: z.string(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: ['*.mdx', '!*.en.mdx'], base: `${contentDir}/posts` }),
  schema: z.object({
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

export const collections = { posts, tags };

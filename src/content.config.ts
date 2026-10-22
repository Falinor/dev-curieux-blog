import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Root of all content. End-to-end tests point it at a fixture directory with the
// same layout: `posts/` holds one `<slug>.mdx` file per Post (its Translation sits
// next to it as `<slug>.en.mdx`), `tags.json` the Tags.
const contentDir = process.env.BLOG_CONTENT_DIR || 'src/content';

const tags = defineCollection({
  loader: file(`${contentDir}/tags.json`),
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
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(reference('tags')).nonempty(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, tags };

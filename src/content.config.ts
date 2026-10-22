import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Root of all content. End-to-end tests point it at a fixture directory with the
// same layout (`posts/` holds one `<slug>.mdx` file per Post).
const contentDir = process.env.BLOG_CONTENT_DIR || 'src/content';

const posts = defineCollection({
  loader: glob({ pattern: '*.mdx', base: `${contentDir}/posts` }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };

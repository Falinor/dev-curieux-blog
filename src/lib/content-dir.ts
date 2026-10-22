// Root of all content: `posts/` holds one `<slug>.mdx` file per Post (its
// Translation sits next to it as `<slug>.en.mdx`), `tags.json` the Tags.
// End-to-end tests point `BLOG_CONTENT_DIR` at a fixture directory with the
// same layout. Read by the content collections and the Translation command
// line, so it runs under plain Node: no `astro:*` imports.
export const contentDir = process.env.BLOG_CONTENT_DIR || 'src/content';

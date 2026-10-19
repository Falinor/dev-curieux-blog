# Blog on blog.curieux.dev, from its own repo

The blog is served at `blog.curieux.dev` from this repo, deployed as its own Cloudflare Worker, rather than at `curieux.dev/blog` or inside the landing page repo. A route on `curieux.dev/blog/*` would have worked (Cloudflare routes take precedence over Custom Domains on the same hostname), but it puts two Workers on one hostname, where a wrong route pattern can shadow landing pages, and needs the build output nested under `dist/blog/`. Google treats subdomains and subfolders roughly alike, so we chose zero shared surface over a shared origin.

## Consequences

- Cloudflare Web Analytics needs a second site for `blog.curieux.dev`.
- Theme preference and other browser storage are not shared with `curieux.dev`.
- Moving to `curieux.dev/blog` later costs a 301 redirect rule and a re-crawl.

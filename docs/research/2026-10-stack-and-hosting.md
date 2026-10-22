# Stack versions and hosting research (2026-10)

Retrieved 2026-10-18. The reference site is `Falinor/curieux-dev` (landing page): Astro 7.1.3, oxlint + ESLint (eslint-plugin-astro, eslint-plugin-oxlint), Prettier + prettier-plugin-astro 0.14.1, TypeScript 6.0.3, lefthook, commitlint, Playwright, pnpm 10.33.0, Node 24, Wrangler static assets on Custom Domains.

How the sources were read:

- Version numbers come from the npm registry (`npm view <pkg> version` / `dist-tags` / `time`).
- The proxy blocked direct fetches of oxc.rs, docs.astro.build, developers.cloudflare.com, devblogs.microsoft.com, help.medium.com, hashnode.com and developers.forem.com. For most of these, the docs were read from their first-party source repositories on GitHub (raw files) instead. The cited URL is the public page; the raw source is named where it matters.
- **UNVERIFIED** marks a claim that could not be checked against a primary source.

## 1. Latest stable versions (2026-10-18)

| Package                   | Latest stable                    | Published  | Reference site pins | Notes                                                        |
| ------------------------- | -------------------------------- | ---------- | ------------------- | ------------------------------------------------------------ |
| astro                     | **7.4.0**                        | 2026-10-15 | 7.1.3               | 7.4.0 raises the minimum Node to 22.22.0                     |
| @astrojs/mdx              | **8.1.0**                        | 2026-10-15 | —                   | peer `astro ^7.2.10`                                         |
| @astrojs/rss              | **4.0.19**                       | 2026-06-30 | —                   |                                                              |
| @astrojs/sitemap          | **3.7.4**                        | 2026-08-31 | 3.7.3               |                                                              |
| @astrojs/check            | **0.9.10**                       | 2026-07-27 | 0.9.9               | peer `typescript ^5.0.0 \|\| ^6.0.0` (see TS below)          |
| typescript                | **7.0.2** (`latest`)             | 2026-07-08 | 6.0.3               | the newest 6.x is 6.0.3                                      |
| pnpm                      | **12.14.0**                      | 2026-10-15 | 10.33.0             | 10.x and 11.x lines are still patched (10.34.7, 11.28.6)     |
| Node.js                   | **24.x "Krypton" LTS** (24.22.0) | 2026-10-14 | 24                  | Node 26 becomes LTS on 2026-10-28                            |
| wrangler                  | **4.151.1**                      | 2026-10-16 | —                   | engines `node >=22.0.0`                                      |
| @playwright/test          | **1.64.1**                       | 2026-10-14 | 1.62.0              |                                                              |
| lefthook                  | **2.2.2**                        | 2026-10-13 | 2.1.10              |                                                              |
| @commitlint/cli           | **21.2.3**                       | 2026-09-19 | 21.2.1              | config-conventional is also 21.2.3                           |
| oxlint                    | **1.88.0**                       | 2026-10-13 | 1.75.0              | eslint-plugin-oxlint is also 1.88.0                          |
| oxfmt                     | **0.73.0**                       | 2026-10-13 | —                   | still 0.x (beta)                                             |
| prettier                  | **3.9.10**                       | 2026-10-10 | 3.9.6               | `next` = 4.0.0-alpha.13 (pre-release)                        |
| prettier-plugin-astro     | **1.1.1**                        | 2026-10-09 | 0.14.1              | 1.x depends on `@astrojs/compiler-rs ^0.4.0`, node >=22.12.0 |
| eslint                    | **10.13.0**                      | 2026-10-16 | 10.8.0              |                                                              |
| eslint-plugin-astro       | **3.2.1**                        | 2026-09-17 | 3.0.1               | peer `eslint >=10`, `@typescript-eslint/parser >=8.61.0`     |
| @typescript-eslint/parser | **8.71.2**                       | —          | 8.65.0              | peer `typescript >=4.8.4 <6.1.0`                             |

Sources: https://www.npmjs.com/package/astro (and the same URL pattern for each package above), https://nodejs.org/dist/index.json, https://github.com/nodejs/Release/blob/main/schedule.json

### Node.js

- Node 24 (Krypton) is Active LTS. It moves to Maintenance on 2026-10-20 and reaches end of life on 2028-04-30. — https://github.com/nodejs/Release/blob/main/schedule.json
- Node 26 (current release 26.12.0) is scheduled to become LTS on 2026-10-28, with end of life on 2029-04-30. — https://github.com/nodejs/Release/blob/main/schedule.json, https://nodejs.org/dist/index.json
- Node 22 (Jod) is in Maintenance until 2027-04-30. — same source

### TypeScript 7 / `tsgo`

- TypeScript 7.0.2 (the native Go port) is the npm `latest` tag. It was published on 2026-07-08 and is marked Latest, not pre-release, on GitHub. — https://www.npmjs.com/package/typescript, https://github.com/microsoft/typescript-go/releases
- The `typescript@7.0.2` package installs a native **`tsc`** binary (`bin: { tsc }`). The separate `tsgo` binary only existed in `@typescript/native-preview`, whose last publish was 2026-07-07. Installing `typescript@7` is now the stable way to get the native compiler. — npm registry metadata for `typescript` and `@typescript/native-preview`
- 7.0 has no stable programmatic API: its package `exports` contain only `./unstable/*` entry points. According to the release blog, a new API is expected in 7.1. The compatibility package `@typescript/typescript6` (6.0.2, binary `tsc6`) lets 6.x run alongside 7.x for tools that need the old API. — npm registry; https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ (**UNVERIFIED**: the proxy blocked the blog, so these statements come from a search-engine summary of it)
- The `microsoft/typescript-go` repository was archived on 2026-09-01. The v7.0.2 tag also appears on `microsoft/TypeScript`. — https://github.com/microsoft/typescript-go/releases, https://github.com/microsoft/TypeScript/releases
- **`astro check` does not work with TypeScript 7.** `@astrojs/check@0.9.10` declares a peer of `typescript ^5 || ^6`. In issue withastro/astro#17268, maintainer matthewp wrote: "TypeScript 7 does not currently support languages like Astro, Vue, Svelte. We cannot fix it until they do." The issue carries the label `triage: unable to fix` and was closed by PR #18053, which only improves the error message. — https://github.com/withastro/astro/issues/17268
- Astro 7.3.4: "Improves the `astro check` error shown for TypeScript 7 … explains that TypeScript 7 is not currently supported … provides instructions for experimentally type-checking Astro files with TypeScript 7.1 and `@astrojs/ts-content-mapper`" (npm 0.2.0, "lets tsc type-check .astro files directly"). Per a maintainer on 2026-09-04, `astro check` "will either be deprecated, or be updated to call `tsc`". — https://github.com/withastro/astro/releases/tag/astro%407.3.4, https://github.com/withastro/astro/issues/17268
- `@typescript-eslint/parser@8.71.2`, which eslint-plugin-astro requires, declares `typescript <6.1.0`. This is a second reason to stay on TypeScript 6.0.3. — npm registry
- **Implication:** pin `typescript@6.0.3` for `astro check` and ESLint.

### GitHub Actions used in CI (not asked; checked because the CI mirrors these)

- `actions/checkout` is at v7.0.1, `actions/setup-node` at v7.1.0 and `pnpm/action-setup` at v6.1.0. The v6.1.0 release notes say "feat: support pnpm v12". The reference CI uses `@v4` for all three. — https://github.com/actions/checkout/releases, https://github.com/actions/setup-node/releases, https://github.com/pnpm/action-setup/releases
- pnpm 12.0.0 (2026-08-26) breaking changes:
  - `pnpm init` now pins the latest pnpm version.
  - Unrecognized `pnpm-workspace.yaml` settings fail the command with `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS`.
  - `--frozen-lockfile false` is removed; use `--no-frozen-lockfile`.
  - The release notes do not change the Node requirement; the package `engines` field says `>=18`.
    — https://github.com/pnpm/pnpm/releases/tag/v12.0.0

## 2. oxfmt

- **Not 1.0.** The latest version is 0.73.0 (2026-10-13). The project announced "Oxfmt has reached beta" on 2026-02-24. There is no stable/1.0 post in the oxc blog. — https://www.npmjs.com/package/oxfmt, https://oxc.rs/blog/2026-02-24-oxfmt-beta (source: github.com/oxc-project/website `src/blog/`)
- **Prettier-compatible by design:**
  - "Oxfmt aims to match Prettier's output … Unexpected differences are treated as bugs."
  - It is tested against Prettier's own test suite for each natively supported language.
  - The default `printWidth` is 100 (Prettier's is 80).
  - `oxfmt --migrate prettier` converts an existing Prettier config.
    — https://oxc.rs/docs/guide/usage/formatter, https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier
- **Native (Rust) formatting:** JS/TS/JSX/TSX, JSON/JSONC/JSON5, CSS/SCSS/Less, GraphQL, TOML, YAML and **Markdown**. — https://oxc.rs/docs/guide/usage/formatter/language-support
- **Formatted through a Prettier copy bundled inside oxfmt:** HTML, Vue, Svelte, **Astro (`.astro`)**, **MDX (`.mdx`)**, Handlebars and MJML. These formats need Node and the npm package; the standalone binary skips them. — https://oxc.rs/docs/guide/usage/formatter/language-support
- **Astro support is brand new and opt-in:**
  - oxfmt 0.73.0 (2026-10-13) added "Support Astro via `prettier-plugin-astro@1.x`", Astro in the LSP, and Astro in `--migrate prettier`. — https://github.com/oxc-project/oxc/releases/tag/oxfmt_v0.73.0
  - The `astro` option is disabled by default.
  - It "requires the `@astrojs/compiler-rs` package at runtime. Oxfmt does NOT bundle it" (oxfmt peer: `@astrojs/compiler-rs ^0.4.0 || ^0.5.0`; latest 0.5.2).
  - Options: `allowShorthand`, `compressHTML`, `skipFrontmatter`.
    — https://oxc.rs/docs/guide/usage/formatter/config-file-reference (generated-config.md in the website repo), npm registry
  - The oxc compatibility matrix rates Astro formatting as "full", with the note "Requires installing `@astrojs/compiler-rs` separately". — https://oxc.rs/compatibility (`.vitepress/data/compat/oxfmt.ts`)
- **Prettier plugins are not supported in general.** Built-in replacements: import sorting, Tailwind class sorting, package.json sorting and jsdoc. `--migrate prettier` maps options from prettier-plugin-astro, -svelte, -tailwindcss and -packagejson; other plugins are skipped with a warning. Also not supported: the `prettier` key in `package.json`, nested `.editorconfig`, and `experimentalTernaries`. — https://oxc.rs/docs/guide/usage/formatter/unsupported-features, https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier
- **Can it fully replace prettier + prettier-plugin-astro here?** Yes, for the file set this repo formats (`js,ts,mjs,astro,css,json,md` plus `mdx`). The reference config (`printWidth: 100`, `singleQuote`, the astro plugin) maps onto oxfmt options. Caveats:
  - oxfmt is still 0.x (beta).
  - Astro support is 5 days old.
  - `.astro` and `.mdx` still run through the bundled Prettier, so they are not faster.
  - You must add `@astrojs/compiler-rs` and set `"astro": true`.
  - The oxc docs themselves say: "Stay on Prettier only if you still depend on exact plugin behavior not yet covered by Oxfmt."
    — sources above
- If ESLint is kept, keep `eslint-config-prettier` to turn off style rules that conflict with oxfmt. — https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier

## 3. oxlint

- **It does not fully replace ESLint for Astro.** oxlint lints `.vue`, `.svelte` and `.astro` "by linting only their `<script>` blocks". For Astro, its partial loader extracts the `---` frontmatter (as TS) and the `<script>` tags. The template is not linted. — https://oxc.rs/docs/guide/usage/linter, https://github.com/oxc-project/oxc/blob/main/crates/oxc_linter/src/loader/partial_loader/astro.rs
- The compatibility matrix rates Astro linting as **"partial"** with the note "No template linting yet" and links issue oxc#15761. That issue is open, covers Vue only and has no target date. — https://oxc.rs/compatibility (`compat/oxlint.ts`), https://github.com/oxc-project/oxc/issues/15761
- oxlint has no native Astro plugin. The native `jsx-a11y` plugin applies to JSX, not Astro templates. — https://oxc.rs/docs/guide/usage/linter/plugins
- **JS plugins are alpha.** "JS plugins are currently in alpha". The ESLint v9+ plugin API is mostly implemented. "Not supported yet: Custom file formats and parsers (e.g. Svelte, Vue, Angular)" and type-aware JS-plugin rules. — https://oxc.rs/docs/guide/usage/linter/js-plugins
  - eslint-plugin-astro depends on `astro-eslint-parser`, a custom parser, so it cannot run under oxlint today. The plugin is not on oxlint's tested list. — npm registry (eslint-plugin-astro@3.2.1 dependencies); **UNVERIFIED** by running it
- **Type-aware linting is stable.** The post "Type-Aware Linting Stable" (2026-07-22) announced tsgolint v7, which tracks TypeScript 7.0.2 and covers 59 of typescript-eslint's 61 type-aware rules.
  - Enable it with `oxlint --type-aware` (optionally `--type-check`) or `options.typeAware: true`. Install `oxlint-tsgolint` (latest 7.0.2004).
  - The docs' stability notes: "Rule coverage is incomplete (but very close)" and very large codebases may see high memory use.
    — https://oxc.rs/blog/2026-07-22-type-aware-linting-stable, https://oxc.rs/docs/guide/usage/linter/type-aware
- Type-aware linting requires TypeScript 7.0+ tsconfig semantics: TS6-deprecated options must be removed, and `baseUrl` is unsupported. `oxlint-tsgolint` declares no `typescript` peer dependency (it ships its own Go binaries), so a TS 6.0.3 install for `astro check` should not block it. That last point is an inference from package metadata. — https://oxc.rs/docs/guide/usage/linter/type-aware, npm registry
- **UNVERIFIED:** whether type-aware rules run on `.astro` frontmatter. Nothing in the docs says so, and TypeScript 7 does not support Astro files.
- The oxc docs recommend replacing ESLint for most projects, or running oxlint first with `eslint-plugin-oxlint` to disable overlapping ESLint rules. — https://oxc.rs/docs/guide/usage/linter
- **Implication:** keep the reference setup. Use oxlint for JS/TS and Astro frontmatter/scripts, and ESLint with eslint-plugin-astro (plus jsx-a11y and eslint-plugin-oxlint) for `.astro` templates.

## 4. Other replacements

- **lefthook: keep.** It is actively released (2.2.2 on 2026-10-13). husky's latest release, 9.1.7, dates from 2024-11-18. — npm registry
  - Vite+ (`vite-plus` 1.3.0, MIT) bundles Oxlint, Oxfmt, Vitest and a git-hook dispatcher (`vp hooks`, `vp staged`), and the oxc docs point to it. It is a whole-toolchain swap, not a drop-in git-hooks tool. — https://www.npmjs.com/package/vite-plus, https://oxc.rs/docs/guide/usage/formatter
- **commitlint: keep.** No clearly mainstream replacement was found. — **UNVERIFIED** (absence of evidence)
- **Playwright smoke tests: keep.** 1.64.1 is current. No clearly mainstream replacement was found. — https://www.npmjs.com/package/@playwright/test

## 5. Cloudflare: Custom Domain (Worker A) plus Route (Worker B)

- **Yes. Worker B on route `curieux.dev/blog*` receives those requests, ahead of Worker A on Custom Domain `curieux.dev`.**
  - Routes docs: "Routes can `fetch()` Custom Domains and take precedence if configured on the same hostname." — https://developers.cloudflare.com/workers/configuration/routing/routes/
  - Custom Domains docs, "Interaction with Routes": "A Worker running on a Custom Domain is treated as an origin. Any Workers running on routes before your Custom Domain can optionally call the Worker registered on your Custom Domain by issuing `fetch(request)`". The example puts a Custom Domain on `api.example.com` and a route on `api.example.com/auth`; "A request to `api.example.com/auth` will trigger your `auth-worker` Worker." — https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- A Custom Domain matches the hostname only ("Other parts (path, query parameters) of the URL are not considered"). `www.curieux.dev` is a separate hostname, so `curieux.dev/blog*` does not cover it. — https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- **Route pattern caveats:**
  - A path ending in `*` matches every suffix, so `/blog*` also matches `/blogroll`.
  - The most specific pattern wins.
  - In Wrangler, routes need `zone_name` or `zone_id`.
  - A route needs a proxied DNS record for the hostname. The Custom Domain creates one; that it satisfies this requirement is an inference.
    — https://developers.cloudflare.com/workers/configuration/routing/routes/
  - Known issue: with `example.com/images/*` (Worker A) and `example.com/images*` (Worker B), Worker B wins even for `/images/hello`. — https://developers.cloudflare.com/workers/platform/known-issues/
- **Static assets on a sub-path:** "Assets defined for a Worker must be nested in a directory structure that mirrors the desired path". To serve `example.com/blog/*`, put files under `dist/blog/`. Files outside the path are not served. Requires Wrangler 3.98.0 or later. — https://developers.cloudflare.com/workers/static-assets/routing/advanced/serving-a-subdirectory/
  - **UNVERIFIED:** whether Astro's `base: '/blog'` alone produces that `dist/blog/` layout. Check the build output.
- Routes cannot be the target of a same-zone `fetch()`. Custom Domains can. — https://developers.cloudflare.com/workers/configuration/routing/

## 6. Cross-posting APIs

- **Medium: no new integrations.**
  - The official API docs repo opens with: "**The Medium API is no longer supported.** We do not recommend using it."
  - It also states: "**IMPORTANT:** We don't allow any new integrations with our API."
  - The repo was archived on 2023-03-02.
  - The documented `POST` post-creation endpoint has an optional `canonicalUrl` field.
    — https://github.com/Medium/medium-api-docs
  - **UNVERIFIED** (third-party only): Medium stopped issuing new self-issued _integration tokens_ on 2025-01-01, and existing tokens keep working. Source: StackOne connector docs. Medium's help center was not reachable. — https://docs.stackone.com/connectors/medium/guides/link-account/integration-token
- **dev.to (Forem): yes.**
  - `POST /api/articles` ("Publish article") accepts `article.canonical_url` ("If this post was originally published elsewhere, specify the canonical URL to maintain SEO integrity").
  - Authentication uses the `api-key` header.
  - The schema also has `published` (default false), up to 4 `tags`, `series`, `main_image` and the newer `ai_disclosure_level`.
    — https://developers.forem.com/api/v1 (source: https://github.com/forem/forem/blob/main/swagger/v1/api_v1.json)
- **Hashnode: yes, but it needs a paid plan.**
  - The GraphQL mutation `publishPost(input: PublishPostInput!)` accepts `originalArticleURL` ("Canonical URL for republished articles"). So do `updatePost` and the draft inputs.
  - The endpoint is `gql.hashnode.com`, authenticated with a PAT.
  - "Write mutations and publication-scoped reads require the target publication to have an active Hashnode Pro plan". Otherwise the API returns `FORBIDDEN`: "Publication does not have an active Pro plan".
    — Hashnode's own repo: https://github.com/Hashnode/gql-skill (`skills/gql-api/references/schema.graphql`, `mutations.md`, `SKILL.md`)
  - That repo cites the changelog https://hashnode.com/changelog/2026-05-13-graphql-api-paid-access. **UNVERIFIED** directly, because the proxy blocked hashnode.com and apidocs.hashnode.com.

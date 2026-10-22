import { defineConfig, envField, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import { codeTheme } from './src/styles/code-theme.ts';

/**
 * A self-hosted variable font from its Fontsource package: the Latin subset
 * only, which covers French and English. Astro copies it into the build and
 * derives a size-adjusted fallback from its metrics, so the swap doesn't shift
 * the layout.
 */
function fontsource(name, cssVariable, file, weight, fallback) {
  return {
    provider: fontProviders.local(),
    name,
    cssVariable,
    fallbacks: [fallback],
    options: { variants: [{ src: [file], weight, style: 'normal' }] },
  };
}

export default defineConfig({
  site: 'https://blog.curieux.dev',
  integrations: [mdx()],
  markdown: { shikiConfig: { theme: codeTheme } },
  // Images in a Post get a `srcset`, so phones download smaller files.
  image: { layout: 'constrained' },
  env: {
    schema: {
      // Cloudflare Web Analytics site token: without it, no page loads the beacon.
      CF_BEACON_TOKEN: envField.string({ context: 'server', access: 'public', optional: true }),
      // The branch Workers Builds is building (it sets the variable itself). A
      // branch other than `main` is a preview: its pages never load the beacon.
      WORKERS_CI_BRANCH: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
  fonts: [
    fontsource(
      'Bricolage Grotesque',
      '--font-display',
      '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
      '200 800',
      'sans-serif',
    ),
    fontsource(
      'Geist',
      '--font-body',
      '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
      '100 900',
      'sans-serif',
    ),
    fontsource(
      'Geist Mono',
      '--font-mono',
      '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
      '100 900',
      'monospace',
    ),
  ],
});

import { defineConfig, envField, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';

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
  env: {
    schema: {
      // Cloudflare Web Analytics site token. Set only for production builds:
      // without it, no page loads the beacon.
      CF_BEACON_TOKEN: envField.string({ context: 'server', access: 'public', optional: true }),
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

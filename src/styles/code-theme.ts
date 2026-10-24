import type { ShikiConfig } from 'astro';

/**
 * Code highlighting drawn from the brand palette. Every color is a DESIGN.md
 * token, which Shiki writes as is into each span's style, so code blocks follow
 * the page's theme like everything else. Operators and punctuation stay in the
 * code's foreground color; comments are italic.
 */
export const codeTheme: ShikiConfig['theme'] = {
  name: 'cartes-postales',
  type: 'dark',
  colors: {
    'editor.background': 'var(--code-bg)',
    'editor.foreground': 'var(--code-fg)',
  },
  tokenColors: [
    {
      scope: [
        'keyword',
        'storage',
        'constant.language',
        'variable.language',
        'support.type.primitive',
      ],
      settings: { foreground: 'var(--tk-kw)' },
    },
    {
      scope: ['keyword.operator', 'punctuation'],
      settings: { foreground: 'var(--code-fg)' },
    },
    {
      scope: [
        'string',
        'punctuation.definition.string',
        'constant.numeric',
        'constant.other.symbol',
      ],
      settings: { foreground: 'var(--tk-str)' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.object-literal.key',
        'support.type.property-name',
        'punctuation.support.type.property-name',
        'entity.name.tag',
        'entity.other.attribute-name',
      ],
      settings: { foreground: 'var(--tk-fn)' },
    },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: 'var(--tk-com)', fontStyle: 'italic' },
    },
  ],
};

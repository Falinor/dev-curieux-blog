/** @type {import('prettier').Config} */
export default {
  plugins: ['prettier-plugin-astro'],
  printWidth: 100,
  singleQuote: true,
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};

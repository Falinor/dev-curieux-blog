import astro from 'eslint-plugin-astro';
import oxlint from 'eslint-plugin-oxlint';

export default [
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  ...oxlint.configs['flat/recommended'],
  { ignores: ['dist/', 'dist-e2e/', '.astro/', 'test-results/', 'playwright-report/'] },
];

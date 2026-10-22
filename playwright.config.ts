import { defineConfig, devices } from '@playwright/test';

// The site is built from fixture content into its own output directory, so the
// real build in `dist/` is never replaced by test content. `--ignore-lock` keeps
// the preview server in the foreground (Astro backgrounds it when an agent runs
// it) and lets it run next to a preview the author already started.
const port = 4322;
const outDir = 'dist-e2e';

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  webServer: {
    command: `astro build --outDir ${outDir} && astro preview --ignore-lock --outDir ${outDir} --port ${port}`,
    env: { BLOG_CONTENT_DIR: 'tests/fixtures/site' },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Cloud sessions preinstall a Chromium build that differs from the npm
        // Playwright's; the SessionStart hook points this variable at it.
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
      },
    },
  ],
});

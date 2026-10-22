import { defineConfig, devices, type Project } from '@playwright/test';

// Each fixture site is built from its own content root
// (`tests/fixtures/<site>`) into its own output directory, so the real build in
// `dist/` is never replaced by test content, and served on its own port.
// `--ignore-lock` keeps the preview server in the foreground (Astro backgrounds
// it when an agent runs it) and lets it run next to a preview the author already
// started. `E2E_PORT` lets parallel checkouts run their suites side by side; the
// other sites take the ports a hundred above it.
const port = Number(process.env.E2E_PORT) || 4322;

const sites = [
  // The main fixture site: most specs, in `tests/e2e/`.
  { name: 'site', port, testDir: './tests/e2e', testIgnore: ['no-pinned/**'] },
  // No published Post is pinned: specs in `tests/e2e/no-pinned/`.
  { name: 'no-pinned', port: port + 100, testDir: './tests/e2e/no-pinned' },
];

const chromium: Project['use'] = {
  ...devices['Desktop Chrome'],
  // Cloud sessions preinstall a Chromium build that differs from the npm
  // Playwright's; the SessionStart hook points this variable at it.
  launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
};

export default defineConfig({
  forbidOnly: !!process.env.CI,
  webServer: sites.map(({ name, port }) => ({
    command: `astro build --outDir dist-e2e/${name} && astro preview --ignore-lock --outDir dist-e2e/${name} --port ${port}`,
    env: { BLOG_CONTENT_DIR: `tests/fixtures/${name}` },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  })),
  projects: sites.map(({ name, port, testDir, testIgnore }) => ({
    name: name === 'site' ? 'chromium' : `chromium ${name}`,
    testDir,
    testIgnore,
    use: { ...chromium, baseURL: `http://localhost:${port}` },
  })),
});

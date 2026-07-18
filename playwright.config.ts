import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression config for critical layout sections.
 * Baselines live next to specs under tests/visual/__screenshots__/.
 * Update baselines intentionally with: bun run test:visual:update
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8080",
    trace: "off",
  },
  // Deterministic snapshot pathing across OSes/CI
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}",
  expect: {
    toHaveScreenshot: {
      // Tolerate sub-pixel font rendering differences between environments
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

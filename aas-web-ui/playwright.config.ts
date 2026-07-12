import { defineConfig } from '@playwright/test'
import { normalizeBasePath } from './tests/integration/basePath'

const runtimeTarget = process.env.IT_TARGET ?? 'preview'
const basePathInput = process.env.IT_BASE_PATH ?? '/ui/'
const port = Number(process.env.IT_PORT ?? '4173')
const timeseriesBaseURL = process.env.IT_TIMESERIES_URL ?? 'http://127.0.0.1:3000'
const disableWebServer = process.env.IT_DISABLE_WEBSERVER === 'true'
const isCI = !!process.env.CI

const normalizedBasePath = normalizeBasePath(basePathInput)
const coreBaseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/integration',
  testMatch: '**/*.pw.ts',
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'integration-core',
      testIgnore: '**/plugins/**',
      use: {
        baseURL: coreBaseURL,
      },
    },
    {
      name: 'integration-timeseries',
      testMatch: '**/plugins/timeseries.pw.ts',
      use: {
        baseURL: timeseriesBaseURL,
      },
    },
  ],
  webServer: disableWebServer
    ? undefined
    : {
        command: './scripts/start-integration-runtime.sh',
        cwd: '.',
        env: {
          ...process.env,
          IT_TARGET: runtimeTarget,
          IT_BASE_PATH: basePathInput,
          IT_BASE_PATH_NORMALIZED: normalizedBasePath,
          IT_PORT: String(port),
          IT_LOGO_MODE: process.env.IT_LOGO_MODE ?? 'none',
          IT_BUILD_DOCKER_IMAGE: process.env.IT_BUILD_DOCKER_IMAGE ?? 'false',
          IT_DOCKER_IMAGE_TAG: process.env.IT_DOCKER_IMAGE_TAG ?? 'aas-web-ui-integration:local',
        },
        url: new URL(normalizedBasePath, coreBaseURL).toString(),
        timeout: 300_000,
        reuseExistingServer: !isCI && runtimeTarget === 'preview',
      },
})

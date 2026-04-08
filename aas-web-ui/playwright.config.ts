import { defineConfig } from '@playwright/test'
import { normalizeBasePath } from './tests/integration/basePath'

const runtimeTarget = process.env.IT_TARGET ?? 'preview'
const basePathInput = process.env.IT_BASE_PATH ?? '/ui/'
const port = Number(process.env.IT_PORT ?? '4173')
const isCI = !!process.env.CI

const normalizedBasePath = normalizeBasePath(basePathInput)

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
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
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
    url: new URL(normalizedBasePath, `http://127.0.0.1:${port}`).toString(),
    timeout: 300_000,
    reuseExistingServer: !isCI && runtimeTarget === 'preview',
  },
})

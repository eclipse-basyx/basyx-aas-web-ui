import { expect, test } from '@playwright/test'

const runtimeTarget = process.env.IT_TARGET ?? 'preview'
const logoMode = process.env.IT_LOGO_MODE ?? 'none'
const basePathInput = process.env.IT_BASE_PATH ?? '/ui/'

function normalizeBasePath (value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return '/'
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (withLeadingSlash === '/') {
    return '/'
  }

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function getPathCandidates (input: string, normalized: string): string[] {
  if (normalized === '/') {
    return ['/']
  }

  const candidates = [normalized]
  if (!input.endsWith('/')) {
    candidates.push(normalized.slice(0, -1))
  }
  return candidates
}

function toBaseScopedPath (basePath: string, suffix: string): string {
  if (basePath === '/') {
    return `/${suffix}`
  }
  return `${basePath}${suffix}`
}

const normalizedBasePath = normalizeBasePath(basePathInput)
const pathCandidates = getPathCandidates(basePathInput, normalizedBasePath)

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light')
  })
})

test('ui is reachable under configured base path', async ({ page, request }) => {
  const response = await page.goto(normalizedBasePath, { waitUntil: 'networkidle' })
  expect(response).not.toBeNull()
  expect(response?.ok()).toBeTruthy()

  const pathname = new URL(page.url()).pathname
  const isPathReachable = pathCandidates.some(candidate => pathname === candidate || pathname.startsWith(candidate))
  expect(isPathReachable).toBeTruthy()

  await expect(page.getByAltText('Logo')).toBeVisible({ timeout: 30_000 })

  const indexResponse = await request.get(normalizedBasePath)
  expect(indexResponse.ok()).toBeTruthy()
  const indexHtml = await indexResponse.text()

  if (runtimeTarget === 'docker') {
    expect(indexHtml).not.toContain('__BASE_PATH_PLACEHOLDER__')
    expect(indexHtml).not.toContain('__LOGO_LIGHT_PATH_PLACEHOLDER__')
  }
})

test('deep link route works under configured base path', async ({ page }) => {
  const deepLinkPath = toBaseScopedPath(normalizedBasePath, 'about')
  const response = await page.goto(deepLinkPath, { waitUntil: 'networkidle' })

  expect(response).not.toBeNull()
  expect(response?.ok()).toBeTruthy()

  const pathname = new URL(page.url()).pathname
  expect(pathname.endsWith('/about')).toBeTruthy()
})

test('infrastructure YAML endpoint is reachable under base path', async ({ request }) => {
  const yamlPath = toBaseScopedPath(normalizedBasePath, 'config/basyx-infra.yml')
  const response = await request.get(yamlPath)

  expect(response.ok()).toBeTruthy()
  const yamlBody = await response.text()
  expect(yamlBody).toContain('infrastructures:')
})

test('custom logo via LOGO_PATH works under non-root base path', async ({ page, request }) => {
  test.skip(logoMode !== 'env', 'LOGO_PATH scenario only')
  test.skip(normalizedBasePath === '/', 'Custom non-root logo scenario requires a non-root base path')

  await page.goto(normalizedBasePath, { waitUntil: 'networkidle' })
  const logo = page.getByAltText('Logo')
  await expect(logo).toBeVisible({ timeout: 30_000 })

  const src = await logo.getAttribute('src')
  expect(src).toBeTruthy()

  const logoUrl = new URL(src as string, page.url())
  expect(logoUrl.pathname).toBe(toBaseScopedPath(normalizedBasePath, 'Logo/custom-logo.svg'))

  const logoResponse = await request.get(logoUrl.toString())
  expect(logoResponse.ok()).toBeTruthy()
  const logoBody = await logoResponse.text()
  expect(logoBody).toContain('integration-logo-marker')
})

test('custom logo via replaced default logo works under non-root base path', async ({ page, request }) => {
  test.skip(logoMode !== 'replace-default', 'Default logo replacement scenario only')
  test.skip(normalizedBasePath === '/', 'Custom non-root logo scenario requires a non-root base path')

  await page.goto(normalizedBasePath, { waitUntil: 'networkidle' })
  const logo = page.getByAltText('Logo')
  await expect(logo).toBeVisible({ timeout: 30_000 })

  const src = await logo.getAttribute('src')
  expect(src).toBeTruthy()

  const logoUrl = new URL(src as string, page.url())
  expect(logoUrl.pathname).toBe(toBaseScopedPath(normalizedBasePath, 'Logo/Logo_light.svg'))

  const logoResponse = await request.get(logoUrl.toString())
  expect(logoResponse.ok()).toBeTruthy()
  const logoBody = await logoResponse.text()
  expect(logoBody).toContain('integration-logo-marker')
})

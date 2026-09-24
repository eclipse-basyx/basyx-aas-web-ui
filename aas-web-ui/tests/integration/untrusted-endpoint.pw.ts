import { expect, test } from '@playwright/test'
import { normalizeBasePath } from './basePath'

test('crafted AAS deep link is blocked and shows an error', async ({ page }) => {
  const attackerUrl = 'https://attacker.invalid/collect'
  const requestsToAttacker: string[] = []
  page.on('request', request => {
    if (request.url().startsWith(attackerUrl)) {
      requestsToAttacker.push(request.url())
    }
  })

  await page.route('**/config/basyx-infra.yml', route => route.fulfill({
    contentType: 'text/yaml',
    body: `infrastructures:
  default: victim
  victim:
    name: Victim
    components:
      aasRepository:
        baseUrl: https://repo.example
    security:
      type: basic
      config:
        username: victim
        password: secret
`,
  }))
  await page.route('https://repo.example/**', route => route.fulfill({
    contentType: 'application/json',
    body: '{"result":[]}',
  }))

  const basePath = normalizeBasePath(process.env.IT_BASE_PATH ?? '/ui/')
  await page.goto(`${basePath}?aas=${encodeURIComponent(attackerUrl)}`)
  await expect(page.getByText(/Untrusted endpoint blocked/)).toBeVisible()
  expect(requestsToAttacker).toEqual([])
})

test('a trusted endpoint cannot redirect a request to an untrusted origin', async ({ page }) => {
  const attackerUrl = 'https://attacker.invalid/collect'
  const basePath = normalizeBasePath(process.env.IT_BASE_PATH ?? '/ui/')
  const redirectUrl = new URL(`${basePath}redirect-target`, test.info().project.use.baseURL as string).toString()
  const requestsToAttacker: string[] = []
  page.on('request', request => {
    if (request.url().startsWith(attackerUrl)) {
      requestsToAttacker.push(request.url())
    }
  })

  await page.route('**/config/basyx-infra.yml', route => route.fulfill({
    contentType: 'text/yaml',
    body: `infrastructures:
  default: victim
  victim:
    name: Victim
    components: {}
    security:
      type: custom-header
      config:
        headerName: X-API-KEY
        headerValue: secret
`,
  }))
  await page.route(redirectUrl, route => route.fulfill({ status: 302, headers: { Location: attackerUrl } }))
  await page.route(attackerUrl, route => route.fulfill({
    contentType: 'application/json',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
    body: '{}',
  }))

  await page.goto(`${basePath}?aas=${encodeURIComponent(redirectUrl)}`, { waitUntil: 'networkidle' })
  await expect(page.getByText(/Redirect blocked/)).toBeVisible()
  expect(requestsToAttacker).toEqual([])
})

import { expect, test } from '@playwright/test'
import { normalizeBasePath } from './basePath'

test('draft connection probes use unsaved endpoints and credentials', async ({ page }) => {
  await page.route('**/config/basyx-infra.yml', route => route.fulfill({
    contentType: 'text/yaml',
    body: `infrastructures:
  default: selected
  selected:
    name: Selected Infrastructure
    components: {}
    security:
      type: basic
      config:
        username: selected
        password: selected-secret
`,
  }))
  const draftRequests: Array<string | undefined> = []
  await page.route('https://draft.example/**', route => {
    draftRequests.push(route.request().headers().authorization)
    return route.fulfill({ contentType: 'application/json', body: '{"profiles":[]}' })
  })

  const basePath = normalizeBasePath(process.env.IT_BASE_PATH ?? '/ui/')
  await page.goto(basePath)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Manage Infrastructures' }).click()
  await page.getByRole('button', { name: 'Add Infrastructure' }).click()

  const endpoint = page.getByRole('textbox', { name: 'AAS Repository Endpoint URL', exact: true })
  await endpoint.fill('https://draft.example')
  await endpoint.press('Enter')
  await expect.poll(() => draftRequests.length).toBe(1)
  expect(draftRequests[0]).toBeUndefined()

  await page.getByRole('button', { name: /Security Configuration/ }).click()
  const authenticationType = page.getByRole('combobox', { name: 'Authentication Type' })
  await authenticationType.press('ArrowDown')
  const basicAuthentication = page.getByRole('option', { name: 'Basic Authentication', exact: true })
  await expect(basicAuthentication).toBeVisible()
  await basicAuthentication.press('Enter')
  await expect(authenticationType).toHaveValue('Basic Authentication')
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('draft')
  await page.getByLabel('Password', { exact: true }).fill('draft-secret')
  await page.getByRole('button', { name: 'Test all connections' }).click()
  await expect.poll(() => draftRequests.length).toBe(2)
  expect(draftRequests[1]).toBe(`Basic ${Buffer.from('draft:draft-secret').toString('base64')}`)
  await expect(page.getByText(/Untrusted endpoint blocked/)).toBeHidden()
})

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

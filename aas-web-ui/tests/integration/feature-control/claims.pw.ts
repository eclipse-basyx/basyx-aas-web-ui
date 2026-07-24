import type { APIRequestContext, Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

async function openAuthenticationMenu (page: Page, icon: string): Promise<Locator> {
  const authenticationMenu = page.locator('button').filter({
    has: page.locator(icon),
  })
  await expect(authenticationMenu).toBeVisible()
  await authenticationMenu.click()

  const menuId = await authenticationMenu.getAttribute('aria-owns')
  if (!menuId) {
    throw new Error('Authentication menu did not expose its menu element')
  }
  return page.locator(`#${menuId}`)
}

async function login (page: Page, username: 'viewer' | 'editor'): Promise<void> {
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.getByAltText('Logo')).toBeVisible({ timeout: 30_000 })

  const authenticationMenu = await openAuthenticationMenu(page, '.mdi-lock-remove')
  await authenticationMenu.getByRole('button', { name: 'Login', exact: true }).click()

  await page.locator('#username').fill(username)
  await page.locator('#password').fill('pwd')
  await page.getByRole('button', { name: /sign in/i }).click()

  await page.waitForURL(url => url.origin === 'http://localhost:3001', { timeout: 30_000 })
  await expect(page.locator('.mdi-account-lock')).toBeVisible({ timeout: 30_000 })
}

async function openMainMenu (page: Page): Promise<void> {
  const menuButton = page.locator('.v-app-bar button').filter({ hasText: /AAS (Viewer|Editor)/ })
  await expect(menuButton).toBeVisible()
  await menuButton.click()
}

async function accessToken (page: Page): Promise<string> {
  return page.evaluate(() => {
    const serialized = localStorage.getItem('basyxInfrastructures')
    if (!serialized) {
      throw new Error('Infrastructure storage is missing')
    }
    const storage = JSON.parse(serialized)
    const selected = storage.infrastructures.find(
      (infrastructure: { id: string }) => infrastructure.id === storage.selectedInfrastructureId,
    )
    if (!selected?.token?.accessToken) {
      throw new Error('Selected infrastructure token is missing')
    }
    return selected.token.accessToken
  })
}

async function assertBackendStatus (
  request: APIRequestContext,
  token: string,
  expectedWriteStatus: number,
): Promise<void> {
  const headers = { Authorization: `Bearer ${token}` }
  const readResponse = await request.get('http://127.0.0.1:8081/shells?limit=1', { headers })
  expect(readResponse.ok()).toBeTruthy()

  const writeResponse = await request.post('http://127.0.0.1:8081/shells', {
    headers,
    data: {},
  })
  expect(writeResponse.status()).toBe(expectedWriteStatus)
}

test('viewer claims restrict presentation and backend writes', async ({ page, request }) => {
  await login(page, 'viewer')
  await openMainMenu(page)
  await expect(page.getByText('AAS Editor', { exact: true })).toHaveCount(0)

  await page.goto('/aaseditor')
  await expect(page).toHaveURL(/\/aasviewer/)
  await assertBackendStatus(request, await accessToken(page), 403)

  const authenticationMenu = await openAuthenticationMenu(page, '.mdi-account-lock')
  await authenticationMenu.getByRole('button', { name: 'Logout', exact: true }).click()
  await page.waitForURL(url => url.origin === 'http://localhost:3001', { timeout: 30_000 })

  await openMainMenu(page)
  await expect(page.getByText('AAS Editor', { exact: true })).toBeVisible()
})

test('editor claims expose editing while backend authorization remains separate', async ({ page, request }) => {
  await login(page, 'editor')
  await openMainMenu(page)
  await expect(page.getByText('AAS Editor', { exact: true })).toBeVisible()

  await assertBackendStatus(request, await accessToken(page), 400)
})

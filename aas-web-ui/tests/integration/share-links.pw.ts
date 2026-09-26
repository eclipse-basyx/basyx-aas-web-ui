import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { normalizeBasePath, toBaseScopedPath } from './basePath'

const basePath = normalizeBasePath(process.env.IT_BASE_PATH ?? '/ui/')
const profile = 'https://basyx.org/aas/API/3/2/RelationshipBasedAccessControl/1.0'
const token = 'a'.repeat(43)
const object = { type: 'aas', id: 'urn:aas' }

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('basyxInfrastructures', JSON.stringify({
      selectedInfrastructureId: 'invitation-test',
      infrastructures: [{
        id: 'invitation-test', name: 'Invitation test', template: 'full', isDefault: true,
        auth: { securityType: 'Bearer Token', bearerToken: { token: 'test-token' } },
        components: Object.fromEntries(['AASDiscovery', 'AASRegistry', 'SubmodelRegistry', 'AASRepo', 'SubmodelRepo', 'ConceptDescriptionRepo', 'CompanyLookup']
          .map(key => [key, { url: key === 'CompanyLookup' ? '' : location.origin + '/invitation-api' }])),
      }],
    }))
  })
})

for (const width of [1280, 390]) {
  test(`creates, revokes and accepts an invitation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let invitations: Array<Record<string, unknown>> = []
    let accepted = false
    await page.route('**/invitation-api/**', async route => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      if (path.endsWith('/description')) {
        return route.fulfill({ json: { profiles: [profile] } })
      }
      if (path.endsWith('/security/rebac/invitations/accept')) {
        expect(request.method()).toBe('POST')
        expect(request.postDataJSON()).toEqual({ token })
        expect(request.headers().authorization).toMatch(/ test-token$/)
        accepted = true
        return route.fulfill({ json: { object, relation: 'viewer' } })
      }
      if (path.endsWith('/$access/effective')) {
        return route.fulfill({ json: { object, rights: [{ action: 'manage', source: 'rebac' }] } })
      }
      if (path.endsWith('/$access')) {
        return route.fulfill({ json: { object, revision: 1, grants: [] }, headers: { ETag: '"1"' } })
      }
      if (path.endsWith('/$access/invitations') && request.method() === 'GET') {
        return route.fulfill({ json: { invitations } })
      }
      if (path.endsWith('/$access/invitations') && request.method() === 'POST') {
        const body = request.postDataJSON()
        expect(body).toMatchObject({ relation: 'viewer', maxUses: 1 })
        expect(Date.parse(body.expiresAt)).toBeGreaterThan(Date.now())
        const invitation = { id: 'invitation-id', relation: 'viewer', expiresAt: body.expiresAt, maxUses: 1, usedCount: 0, restricted: false }
        invitations = [invitation]
        return route.fulfill({ status: 201, json: { ...invitation, token } })
      }
      if (path.endsWith('/$access/invitations/invitation-id') && request.method() === 'DELETE') {
        invitations = []
        return route.fulfill({ status: 204 })
      }
      if (!path.includes('/$access')) {
        return route.fulfill({ json: {} })
      }
      throw new Error(`Unexpected access operation ${request.method()} ${path}`)
    })

    await page.goto(toBaseScopedPath(basePath, 'modules/resourceaccess'), { waitUntil: 'networkidle' })
    await page.getByRole('textbox', { name: 'AAS ID', exact: true }).fill('urn:aas')
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    const dialog = page.getByRole('dialog').last()
    await dialog.getByRole('tab', { name: 'Invitation links', exact: true }).click()
    await dialog.getByRole('button', { name: 'Create link', exact: true }).click()
    const field = dialog.locator('input[readonly]')
    await expect(field).toHaveValue(/#\/share-access\?token=/)
    await expect(dialog.getByText(/used 0 of 1/)).toBeVisible()
    const link = await field.inputValue()
    await dialog.getByRole('button', { name: 'Revoke invitation' }).click()
    await expect(page.getByText('Invitation revoked.', { exact: true })).toBeVisible()
    await expect(dialog.getByText('There are no open invitations.')).toBeVisible()

    const requestsWithSecrets: string[] = []
    page.on('request', request => {
      if (request.url().includes(token)) {
        requestsWithSecrets.push(request.url())
      }
    })
    await page.goto(link, { waitUntil: 'networkidle' })
    const accept = page.getByRole('main').getByRole('button', { name: 'Accept invitation', exact: true })
    await expect(accept).toBeEnabled()
    expect(page.url()).not.toContain(token)
    expect(accepted).toBe(false)
    await accept.click()
    await expect(page.getByText(/You are now viewer of the shell/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', /aasviewer\?aas=/)
    expect(accepted).toBe(true)
    expect(requestsWithSecrets).toEqual([])
    expect(await page.evaluate(() => sessionStorage.getItem('pending-share-invitation'))).toBeNull()
  })
}

test('keeps unavailable invitations generic and blocks unconfigured services', async ({ page }) => {
  let acceptRequests = 0
  await page.route('**/invitation-api/**', async route => {
    if (route.request().url().endsWith('/description')) {
      return route.fulfill({ json: { profiles: [profile] } })
    }
    if (route.request().url().endsWith('/invitations/accept')) {
      acceptRequests++
      return route.fulfill({ status: 404, json: [{ text: 'hidden-resource wrong-recipient' }] })
    }
    return route.fulfill({ json: {} })
  })
  await page.goto(toBaseScopedPath(basePath, 'share-access'), { waitUntil: 'networkidle' })
  await openInvitation(page, 'https://unconfigured.invalid')
  await expect(page.getByRole('main').getByRole('button', { name: 'Accept invitation', exact: true })).toBeDisabled()
  expect(acceptRequests).toBe(0)
  await openInvitation(page, new URL(page.url()).origin + '/invitation-api')
  await page.getByRole('main').getByRole('button', { name: 'Accept invitation', exact: true }).click()
  await expect(page.getByText('This invitation is invalid, expired or already used. Ask the sender for a new link.')).toBeVisible()
  await expect(page.getByText(/hidden-resource|wrong-recipient/)).toHaveCount(0)
})

async function openInvitation (page: Page, service: string): Promise<void> {
  const link = new URL(toBaseScopedPath(basePath, ''), page.url())
  link.hash = '/share-access?' + new URLSearchParams({ token, service, component: 'AASRepo' })
  await page.goto(link.href, { waitUntil: 'networkidle' })
}

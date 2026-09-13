import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { normalizeBasePath, toBaseScopedPath } from './basePath'

const basePath = normalizeBasePath(process.env.IT_BASE_PATH ?? '/ui/')
const profile = 'https://basyx.org/aas/API/3/2/ResourceBoundAccessControl/1.0'
const token = 'a'.repeat(43)
const resource = { IDENTIFIABLE: '$aas("urn:aas")' }

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
    let localPolicy: unknown = null
    let revision = 1
    let revoked = false
    let redeemed = false
    let createCount = 0
    await page.route('**/invitation-api/**', async route => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      if (path.endsWith('/description')) {
        return route.fulfill({ json: { profiles: [profile] } })
      }
      if (path.endsWith('/security/rebac/share-links/redeem')) {
        expect(request.method()).toBe('POST')
        expect(request.postDataJSON()).toEqual({ token })
        expect(request.headers().authorization).toMatch(/ test-token$/)
        redeemed = true
        return route.fulfill({ status: 201, json: { grantId: 'grant-id' } })
      }
      if (!path.includes('/$access')) {
        return route.fulfill({ json: {} })
      }
      if (request.method() === 'GET') {
        return route.fulfill({
          json: { revision, resource, localPolicy, effectivePolicy: { RESOURCE: resource, rules: [] }, grants: [], owners: [], managers: [] },
          headers: { ETag: `"revision-${revision}"` },
        })
      }
      expect(request.headers()['if-match']).toBe(`"revision-${revision}"`)
      if (path.endsWith('/policy')) {
        localPolicy = request.postDataJSON()
        revision++
        return route.fulfill({ json: localPolicy, headers: { ETag: `"revision-${revision}"` } })
      }
      if (path.endsWith('/share-links') && request.method() === 'POST') {
        createCount++
        expect(localPolicy).not.toBeNull()
        expect(request.postDataJSON()).toEqual({ rights: ['READ'], expiresInSeconds: 3600 })
        return route.fulfill({ status: 201, json: { id: 'link-id', shareLink: '#/share-access?token=' + token, expiresAt: new Date(Date.now() + 3_600_000).toISOString() } })
      }
      if (path.endsWith('/share-links/link-id') && request.method() === 'DELETE') {
        revoked = true
        return route.fulfill({ status: 204 })
      }
      throw new Error('Unexpected access operation')
    })

    await page.goto(toBaseScopedPath(basePath, 'modules/resourceaccess'), { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Find a resource by ID' }).click()
    await page.getByRole('textbox', { name: 'AAS ID', exact: true }).fill('urn:aas')
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await page.getByRole('tab', { name: 'Invitation link', exact: true }).click()
    await page.getByRole('button', { name: 'Enable invitation links' }).click()
    const confirmation = page.getByRole('dialog').last()
    await expect(confirmation.getByText(/Future permission changes to the parent/)).toBeVisible()
    expect(createCount).toBe(0)
    await confirmation.getByRole('button', { name: 'Do not inherit access rules', exact: true }).click()
    await page.getByRole('button', { name: 'Create invitation link' }).click()
    const field = page.getByRole('textbox', { name: 'Invitation link', exact: true })
    await expect(field).toHaveValue(/#\/share-access\?token=/)
    await page.screenshot({ path: `/private/tmp/share-link-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Revoke link' }).click()
    await expect(page.getByText('Invitation link revoked.', { exact: true })).toBeVisible()
    expect(revoked).toBe(true)
    await page.getByRole('button', { name: 'Create invitation link' }).click()
    await expect(field).toBeVisible()
    const link = await field.inputValue()
    const requestsWithSecrets: string[] = []
    page.on('request', request => {
      if (request.url().includes(token)) {
        requestsWithSecrets.push(request.url())
      }
    })
    await page.goto(link, { waitUntil: 'networkidle' })
    await expect(page.getByRole('main').getByRole('button', { name: 'Accept invitation', exact: true })).toBeEnabled()
    expect(page.url()).not.toContain(token)
    expect(redeemed).toBe(false)
    await page.getByRole('main').getByRole('button', { name: 'Accept invitation', exact: true }).click()
    await expect(page.getByText(/Access granted. You can now find/)).toBeVisible()
    expect(redeemed).toBe(true)
    expect(requestsWithSecrets).toEqual([])
    expect(await page.evaluate(() => sessionStorage.getItem('pending-share-invitation'))).toBeNull()
  })
}

test('keeps unavailable invitations generic and blocks unconfigured services', async ({ page }) => {
  let redemptionRequests = 0
  await page.route('**/invitation-api/**', async route => {
    if (route.request().url().endsWith('/description')) {
      return route.fulfill({ json: { profiles: [profile] } })
    }
    if (route.request().url().endsWith('/redeem')) {
      redemptionRequests++
      return route.fulfill({ status: 404, json: { message: 'hidden-resource wrong-recipient' } })
    }
    return route.fulfill({ json: {} })
  })
  await page.goto(toBaseScopedPath(basePath, 'share-access'), { waitUntil: 'networkidle' })
  await openInvitation(page, 'https://unconfigured.invalid')
  await expect(page.getByRole('main').getByRole('button', { name: 'Accept invitation', exact: true })).toBeDisabled()
  expect(redemptionRequests).toBe(0)
  await openInvitation(page, new URL(page.url()).origin + '/invitation-api')
  await page.getByRole('main').getByRole('button', { name: 'Accept invitation', exact: true }).click()
  await expect(page.getByText('This invitation is unavailable. Ask the sender for a new link.')).toBeVisible()
  await expect(page.getByText(/hidden-resource|wrong-recipient/)).toHaveCount(0)
})

async function openInvitation (page: Page, service: string): Promise<void> {
  const link = new URL(toBaseScopedPath(basePath, ''), page.url())
  link.hash = '/share-access?' + new URLSearchParams({ token, service, component: 'AASRepo' })
  await page.goto(link.href, { waitUntil: 'networkidle' })
}

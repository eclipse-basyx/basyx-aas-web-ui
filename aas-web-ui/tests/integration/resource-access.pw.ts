import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { normalizeBasePath, toBaseScopedPath } from './basePath'

const basePath = normalizeBasePath(process.env.IT_BASE_PATH ?? '/ui/')
const profile = 'https://basyx.org/aas/API/3/2/RelationshipBasedAccessControl/1.0'
const issuer = 'https://issuer.example'
const object = { type: 'aas', id: 'urn:aas' }

test.beforeEach(async ({ page }) => {
  await seedSecuredInfrastructure(page)
})

test('does not expose sharing or call access APIs without the profile', async ({ page }) => {
  const accessRequests: string[] = []
  await page.route('**/rebac-api/**', async route => {
    if (route.request().url().includes('/$access')) {
      accessRequests.push(route.request().url())
    }
    await route.fulfill({ json: { profiles: [] } })
  })
  await page.goto(toBaseScopedPath(basePath, 'modules/resourceaccess'), { waitUntil: 'networkidle' })
  await expect(page.getByText(/Sharing is not available on the connected services/)).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Resources' })).toHaveCount(0)
  expect(accessRequests).toEqual([])
})

for (const width of [1280, 390]) {
  test(`shares an individual AAS at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let revision = 1
    let grants: Array<Record<string, unknown>> = [{ relation: 'owner', subjectType: 'user', issuer, subject: 'admin' }]
    let rejectNextChange = false

    await page.route('**/rebac-api/**', async route => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      if (path.endsWith('/description')) {
        return route.fulfill({ json: { profiles: [profile] } })
      }
      if (!path.includes('/$access')) {
        return route.fulfill({ json: {} })
      }
      expect(path).toContain('/shells/dXJuOmFhcw/$access')
      expect(request.headers().authorization).toMatch(/ test-token$/)
      if (path.endsWith('/$access/effective')) {
        return route.fulfill({ json: { object, rights: [{ action: 'read', source: 'rebac' }, { action: 'manage', source: 'rebac' }] } })
      }
      if (path.endsWith('/$access/invitations')) {
        return route.fulfill({ json: { invitations: [] } })
      }
      if (request.method() === 'GET') {
        return route.fulfill({ json: { object, revision, grants }, headers: { ETag: `"${revision}"` } })
      }
      expect(path.endsWith('/$access/grants') && request.method() === 'PUT').toBe(true)
      expect(request.headers()['if-match']).toBe(`"${revision}"`)
      if (rejectNextChange) {
        rejectNextChange = false
        revision++
        return route.fulfill({ status: 412, json: [{ code: '412', text: 'stale access revision' }] })
      }
      grants = request.postDataJSON().grants
      revision++
      return route.fulfill({ json: { object, revision, grants }, headers: { ETag: `"${revision}"` } })
    })

    await page.goto(toBaseScopedPath(basePath, 'modules/resourceaccess'), { waitUntil: 'networkidle' })
    await expect(page.getByRole('main').getByText('Access Management', { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: 'AAS ID', exact: true }).fill('urn:aas')
    await page.getByRole('button', { name: 'Share', exact: true }).click()

    const dialog = page.getByRole('dialog').last()
    await expect(dialog.getByText('Share Asset Administration Shell')).toBeVisible()
    await expect(dialog.getByText('Manage access', { exact: true })).toBeVisible()
    await expect(dialog.getByText('admin', { exact: true })).toBeVisible()

    await dialog.getByRole('textbox', { name: 'Identity provider (issuer)' }).fill(issuer)
    await dialog.getByRole('textbox', { name: 'User ID', exact: true }).fill('reader')
    await dialog.getByRole('button', { name: 'Share', exact: true }).click()
    await expect(page.getByText('Shared with reader.', { exact: true })).toBeVisible()
    expect(grants).toContainEqual({ relation: 'viewer', subjectType: 'user', issuer, subject: 'reader' })

    await dialog.getByRole('button', { name: 'Group', exact: true }).click()
    await dialog.getByRole('textbox', { name: 'Group name', exact: true }).fill('engineering')
    await dialog.getByRole('button', { name: 'Share', exact: true }).click()
    await expect(dialog.getByText('engineering', { exact: true })).toBeVisible()
    expect(grants).toContainEqual({ relation: 'viewer', subjectType: 'group', issuer, subject: 'engineering' })
    await page.screenshot({ path: `/private/tmp/rebac-share-${width}.png`, fullPage: true })

    await dialog.getByRole('button', { name: 'Remove access of engineering', exact: true }).click()
    const confirmation = page.getByRole('dialog').last()
    await expect(confirmation.getByText(/engineering will lose the viewer role/)).toBeVisible()
    await confirmation.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(page.getByText('Access removed.', { exact: true })).toBeVisible()
    expect(grants.some(grant => grant.subject === 'engineering')).toBe(false)

    rejectNextChange = true
    await dialog.getByRole('button', { name: 'Remove access of reader', exact: true }).click()
    await page.getByRole('dialog').last().getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(dialog.getByText(/changed by someone else/)).toBeVisible()
    await expect(dialog.getByText('reader', { exact: true })).toBeVisible()
  })
}

async function seedSecuredInfrastructure (page: Page): Promise<void> {
  await page.addInitScript(() => {
    const component = (url: string) => ({ url })
    localStorage.setItem('theme', 'light')
    localStorage.setItem('basyxInfrastructures', JSON.stringify({
      selectedInfrastructureId: 'rebac-test',
      infrastructures: [{
        id: 'rebac-test',
        name: 'ReBAC test',
        template: 'full',
        isDefault: true,
        auth: { securityType: 'Bearer Token', bearerToken: { token: 'test-token' } },
        components: {
          AASDiscovery: component(`${location.origin}/rebac-api`),
          AASRegistry: component(`${location.origin}/rebac-api`),
          SubmodelRegistry: component(`${location.origin}/rebac-api`),
          AASRepo: component(`${location.origin}/rebac-api`),
          SubmodelRepo: component(`${location.origin}/rebac-api`),
          ConceptDescriptionRepo: component(`${location.origin}/rebac-api`),
          CompanyLookup: component(''),
        },
      }],
    }))
  })
}

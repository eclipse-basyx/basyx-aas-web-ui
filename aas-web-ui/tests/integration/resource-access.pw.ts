import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { normalizeBasePath, toBaseScopedPath } from './basePath'

const basePath = normalizeBasePath(process.env.IT_BASE_PATH ?? '/ui/')
const resource = { IDENTIFIABLE: '$aas("urn:aas")' }
const inheritedPolicy = { RESOURCE: resource, rules: [] }

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
  await expect(page.getByText('Sharing is not available on the connected services.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Find a resource by ID' })).toHaveCount(0)
  expect(accessRequests).toEqual([])
})

for (const width of [1280, 390]) {
  test(`shares an individual AAS at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let revision = 1
    let localPolicy: Record<string, unknown> | null = null
    const grants: Array<Record<string, unknown>> = []
    let rejectManagerUpdate = false
    let rejectFirstGrant = true

    await page.route('**/rebac-api/**', async route => {
      const request = route.request()
      if (request.url().endsWith('/description')) {
        await route.fulfill({ json: { profiles: ['https://basyx.org/aas/API/3/2/ResourceBoundAccessControl/1.0'] } })
        return
      }
      if (!request.url().includes('/$access')) {
        await route.fulfill({ json: {} })
        return
      }
      expect(new URL(request.url()).pathname).toContain('/shells/dXJuOmFhcw/$access')
      expect(request.headers().authorization).toMatch(/ test-token$/)
      if (request.method() === 'GET') {
        await route.fulfill({
          json: {
            revision,
            resource,
            localPolicy,
            effectivePolicy: localPolicy ?? inheritedPolicy,
            owners: [{ issuer: 'https://issuer.example', subject: 'admin' }],
            managers: [],
            grants,
          },
          headers: { ETag: `"revision-${revision}"` },
        })
        return
      }

      expect(request.headers()['if-match']).toBe(`"revision-${revision}"`)
      if (request.url().endsWith('/policy') && request.method() === 'PUT') {
        localPolicy = request.postDataJSON()
        revision++
        await route.fulfill({ json: localPolicy, headers: { ETag: `"revision-${revision}"` } })
        return
      }
      if (request.url().endsWith('/grants') && request.method() === 'POST') {
        if (rejectFirstGrant) {
          rejectFirstGrant = false
          await route.fulfill({ status: 403, json: { message: 'not allowed' } })
          return
        }
        const grant = { id: `00000000-0000-4000-8000-${String(grants.length + 1).padStart(12, '0')}`, ...request.postDataJSON() }
        grants.push(grant)
        revision++
        await route.fulfill({ status: 201, json: grant, headers: { ETag: `"revision-${revision}"` } })
        return
      }
      if (request.url().includes('/grants/') && request.method() === 'PUT') {
        const grant = grants.find(item => item.id === request.url().split('/').at(-1))!
        Object.assign(grant, request.postDataJSON())
        revision++
        await route.fulfill({ json: grant })
        return
      }
      if (request.url().includes('/grants/') && request.method() === 'DELETE') {
        grants.splice(grants.findIndex(item => item.id === request.url().split('/').at(-1)), 1)
        revision++
        await route.fulfill({ status: 204 })
        return
      }
      if (request.url().endsWith('/managers') && request.method() === 'PUT' && rejectManagerUpdate) {
        revision++
        await route.fulfill({ status: 412, json: { status: 412, message: 'stale access revision' } })
        return
      }
      await route.fulfill({ status: 405 })
    })

    await page.goto(toBaseScopedPath(basePath, 'modules/resourceaccess'), { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Access Management' })).toBeVisible()
    await expect(page.getByText('Who can create new resources?')).toHaveCount(0)
    await page.getByRole('button', { name: 'Find a resource by ID' }).click()
    await page.getByRole('textbox', { name: 'AAS ID', exact: true }).fill('urn:aas')
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await expect(page.getByText(/Access rules are inherited from the parent/)).toBeVisible()
    await expect(page.getByText('admin', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Share access', exact: true }).click()
    await page.getByRole('textbox', { name: 'Provider URL' }).fill('https://issuer.example')
    await page.getByRole('textbox', { name: 'Account ID', exact: true }).fill('aas-creator')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('combobox', { name: 'Access level' })).toBeVisible()
    await expect(page.getByText('Can view', { exact: true })).toBeVisible()
    expect(localPolicy).toBeNull()
    const share = page.getByRole('button', { name: 'Share', exact: true }).last()
    await page.screenshot({ path: `/private/tmp/rebac-share-${width}.png`, fullPage: true })
    await share.click()
    const confirmation = page.getByRole('dialog').last()
    await expect(confirmation.getByText(/Future permission changes to the parent/)).toBeVisible()
    await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click()
    expect(localPolicy).toBeNull()
    expect(grants).toHaveLength(0)
    await share.click()
    await confirmation.getByRole('button', { name: 'Do not inherit and share' }).click()
    await expect(page.getByText(/Only an owner or manager/)).toBeVisible()
    expect(localPolicy).not.toBeNull()
    expect(grants).toHaveLength(0)
    await expect(share).toBeVisible()
    await share.click()
    await expect(page.getByText('Access granted.', { exact: true })).toBeVisible()

    await expect(page.getByText('aas-creator', { exact: true })).toBeVisible()
    expect(grants[0]).toMatchObject({
      principal: { issuer: 'https://issuer.example', subject: 'aas-creator' },
      rights: ['READ'],
    })

    await page.getByRole('button', { name: 'Share access', exact: true }).click()
    await page.getByRole('button', { name: 'Group', exact: true }).click()
    await page.getByRole('textbox', { name: 'Group name or path' }).fill('/engineering')
    await page.getByRole('textbox', { name: 'Provider URL' }).fill('https://issuer.example')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByRole('button', { name: 'Share', exact: true }).last().click()
    await expect(page.getByText('Access applies to group members.', { exact: true })).toBeVisible()
    expect(grants[1]).toMatchObject({ principal: { type: 'group', issuer: 'https://issuer.example', subject: '/engineering' }, rights: ['READ'] })
    await page.screenshot({ path: `/private/tmp/rebac-groups-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Edit access for Group: /engineering', exact: true }).click()
    const accessLevel = page.getByRole('combobox', { name: 'Access level' })
    await accessLevel.locator('..').click()
    await page.getByRole('option', { name: 'Can edit', exact: true }).click()
    await expect(accessLevel).toHaveValue('Can edit')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(page.getByText('Access updated.', { exact: true })).toBeVisible()
    expect(grants[1]).toMatchObject({ principal: { type: 'group' }, rights: ['READ', 'UPDATE'] })
    await page.getByRole('button', { name: 'Remove access for Group: /engineering', exact: true }).click()
    await expect(page.getByText(/Members of group \/engineering will lose/)).toBeVisible()
    await page.getByRole('button', { name: 'Remove access', exact: true }).click()
    await expect(page.getByText('Access removed.', { exact: true })).toBeVisible()
    expect(grants).toHaveLength(1)

    rejectManagerUpdate = true
    await page.screenshot({ path: `/private/tmp/rebac-people-${width}.png`, fullPage: true })
    await page.getByRole('tab', { name: 'Administration' }).click()
    await page.getByRole('button', { name: 'Advanced access rules', exact: true }).click()
    await page.getByRole('button', { name: 'Technical policy editor (JSON)', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Resource-bound policy' })).toBeVisible()
    await page.screenshot({ path: `/private/tmp/rebac-monaco-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Access managers', exact: true }).click()
    const managerPanel = page.locator('.v-window-item--active')
    await managerPanel.getByRole('textbox', { name: 'Provider URL' }).fill('https://issuer.example')
    await managerPanel.getByRole('textbox', { name: 'Account ID', exact: true }).fill('manager')
    await managerPanel.getByRole('button', { name: 'Add person', exact: true }).click()
    await managerPanel.getByRole('button', { name: 'Save managers' }).click()
    await expect(page.getByText(/changed by someone else/)).toBeVisible()
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

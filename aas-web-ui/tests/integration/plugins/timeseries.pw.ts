import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light')
  })
})

test('timeseries plugin is reachable in the example runtime', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'networkidle' })
  expect(response).not.toBeNull()
  expect(response?.ok()).toBeTruthy()

  await expect(page.getByAltText('Logo')).toBeVisible({ timeout: 30_000 })

  const aasLocator = page.getByText('SensorExampleAAS').first()
  await expect(aasLocator).toBeVisible({ timeout: 30_000 })
  await aasLocator.click()

  const submodelLocator = page.getByText('TimeSeries').first()
  await expect(submodelLocator).toBeVisible({ timeout: 30_000 })
  await submodelLocator.click()
  await page.getByRole('button', { name: 'Visualization' }).click()

  await expect(page.getByText('Preview Configuration:')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('combobox', { name: 'Segment' }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Preview Chart:')).toBeVisible({ timeout: 30_000 })
})

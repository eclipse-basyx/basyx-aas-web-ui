import { expect, type Page, test } from '@playwright/test'

async function selectByKeyboard (
  page: Page,
  selectIndex: number,
  downPresses: number,
) {
  const comboBox = page.locator('.v-select').nth(selectIndex).getByRole('combobox').first()
  await comboBox.click({ force: true })
  for (let i = 0; i < downPresses; i++) {
    await comboBox.press('ArrowDown')
  }
  await comboBox.press('Enter')
}

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
  await expect(page.locator('.v-select').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Preview Chart:')).toBeVisible({ timeout: 30_000 })

  await selectByKeyboard(page, 0, 1)
  await selectByKeyboard(page, 1, 1)
  await selectByKeyboard(page, 2, 2)
  await page.keyboard.press('Escape')

  const fetchButton = page.getByRole('button', { name: 'Fetch Data' }).locator(':visible').first()
  await expect(fetchButton).toBeVisible({ timeout: 30_000 })
  const [linkedResponse] = await Promise.all([
    page.waitForResponse(
      resp => resp.request().method() === 'POST' && resp.url().includes('/api/v2/query'),
      { timeout: 30_000 },
    ),
    fetchButton.click({ force: true }),
  ])
  expect(linkedResponse.ok()).toBeTruthy()

  await selectByKeyboard(page, 3, 1)
  await expect(page.getByRole('application', { name: /line chart/i })).toBeVisible({ timeout: 30_000 })
})

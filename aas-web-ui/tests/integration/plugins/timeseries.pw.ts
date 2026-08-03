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

  const timeRangeButton = page.getByRole('button', { name: 'Time range: Last 1m' })
  const autoRefreshButton = page.getByRole('button', { name: 'Auto refresh: Off' })
  await expect(timeRangeButton).toBeVisible()
  await expect(autoRefreshButton).toBeVisible()

  const timeRangeBox = await timeRangeButton.boundingBox()
  const autoRefreshBox = await autoRefreshButton.boundingBox()
  expect(timeRangeBox).not.toBeNull()
  expect(autoRefreshBox).not.toBeNull()
  expect(Math.abs(timeRangeBox!.y - autoRefreshBox!.y)).toBeLessThan(2)

  await timeRangeButton.click()
  await expect(page.getByText('Time Range', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { exact: true, name: 'Relative' })).toBeVisible()
  const timeRangeMenu = page
    .locator('.v-overlay--active')
    .filter({ hasText: 'Time Range' })
    .locator('.v-card')
  await expect.poll(async () => (await timeRangeMenu.boundingBox())?.width ?? 0).toBeGreaterThan(390)

  const firstPresetRow = await Promise.all([
    page.getByRole('button', { name: 'Last 1 minute' }).boundingBox(),
    page.getByRole('button', { name: 'Last 5 minutes' }).boundingBox(),
    page.getByRole('button', { name: 'Last 15 minutes' }).boundingBox(),
    page.getByRole('button', { name: 'Last 1 hour' }).boundingBox(),
  ])
  expect(firstPresetRow.every(box => box !== null)).toBeTruthy()
  expect(Math.max(...firstPresetRow.map(box => box!.y)) - Math.min(...firstPresetRow.map(box => box!.y)))
    .toBeLessThan(2)
  expect(Math.max(...firstPresetRow.map(box => box!.width)) - Math.min(...firstPresetRow.map(box => box!.width)))
    .toBeLessThan(2)

  await page.getByRole('button', { name: 'Custom relative range' }).click()
  const customRangeControl = timeRangeMenu.locator('.v-text-field .v-field')
  const millisecondsButton = timeRangeMenu.getByRole('button', { name: 'Milliseconds' })
  const customRangeBox = await customRangeControl.boundingBox()
  const millisecondsBox = await millisecondsButton.boundingBox()
  expect(customRangeBox).not.toBeNull()
  expect(millisecondsBox).not.toBeNull()
  expect(Math.abs(customRangeBox!.y - millisecondsBox!.y)).toBeLessThan(2)

  await page.getByRole('button', { name: 'Last 5 minutes' }).click()
  await expect(page.getByRole('button', { name: 'Time range: Last 5m' })).toBeVisible()
  await page.getByRole('button', { name: 'Close time range menu' }).click()
  await expect(page.getByText('Time Range', { exact: true })).toBeHidden()

  await autoRefreshButton.click()
  const autoRefreshMenu = page
    .locator('.v-overlay--active')
    .filter({ hasText: 'Auto Refresh' })
    .locator('.v-card')
  const refreshIntervalInput = page.getByRole('spinbutton', { name: 'Refresh every' })
  const refreshIntervalControl = autoRefreshMenu.locator('.v-text-field .v-field')
  const secondsButton = autoRefreshMenu.getByRole('button', { name: 'Seconds' })
  const minutesButton = autoRefreshMenu.getByRole('button', { name: 'Minutes' })
  const hoursButton = autoRefreshMenu.getByRole('button', { name: 'Hours' })
  await expect(autoRefreshMenu).toBeVisible()
  await expect.poll(async () => (await autoRefreshMenu.boundingBox())?.width ?? 0).toBeGreaterThan(330)
  await expect(page.getByRole('checkbox', { name: 'Auto refresh' })).not.toBeChecked()
  await expect(refreshIntervalInput).toBeDisabled()
  await expect(minutesButton).toBeDisabled()

  const autoRefreshMenuBox = await autoRefreshMenu.boundingBox()
  const refreshIntervalBox = await refreshIntervalControl.boundingBox()
  const unitBoxes = await Promise.all([
    secondsButton.boundingBox(),
    minutesButton.boundingBox(),
    hoursButton.boundingBox(),
  ])
  expect(autoRefreshMenuBox).not.toBeNull()
  expect(refreshIntervalBox).not.toBeNull()
  expect(unitBoxes.every(box => box !== null)).toBeTruthy()
  expect(Math.max(...unitBoxes.map(box => box!.y)) - Math.min(...unitBoxes.map(box => box!.y))).toBeLessThan(2)
  expect(Math.abs(refreshIntervalBox!.y - unitBoxes[0]!.y)).toBeLessThan(2)
  expect(Math.abs(refreshIntervalBox!.height - unitBoxes[0]!.height)).toBeLessThan(2)
  expect(unitBoxes[2]!.x + unitBoxes[2]!.width).toBeLessThanOrEqual(
    autoRefreshMenuBox!.x + autoRefreshMenuBox!.width,
  )
  await page.getByRole('button', { name: 'Close auto refresh menu' }).click()

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
  const query = linkedResponse.request().postData() || ''
  const rangeMatch = query.match(/range\(start: (\d{4}-\d{2}-\d{2}T.*?Z), stop: (\d{4}-\d{2}-\d{2}T.*?Z)\)/)
  expect(rangeMatch).not.toBeNull()
  expect(Date.parse(rangeMatch![2]) - Date.parse(rangeMatch![1])).toBe(5 * 60_000)
  expect(query).toMatch(/aggregateWindow\(every: \d+ms/)
  expect(query).not.toMatch(/v\.(timeRangeStart|timeRangeStop|windowPeriod)/)

  const chartTypeSelect = page.getByRole('combobox', { name: 'Chart Type' })
  await chartTypeSelect.click({ force: true })
  await page.getByRole('option', { name: 'Line Chart' }).click()
  await expect(chartTypeSelect).toHaveValue('Line Chart')
  await expect(page.getByRole('application', { name: /line chart/i })).toBeVisible({ timeout: 30_000 })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadCompanyLogo, uploadConsolidatedDataFile } from '@/pages/modules/CompanyDataPortal/utils/aasAPI'

const baseUrl = 'http://localhost:8081'
const fetchMock = vi.fn()

function sentForm (): FormData {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return init.body as FormData
}

function expectFileName (form: FormData, fileName: string): void {
  const file = form.get('file') as File
  expect(file.name).toBe(fileName)
  expect(form.get('fileName')).toBe(fileName)
}

describe('CompanyDataPortal attachment uploads', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('sends the requested company logo name as filename of the file part', async () => {
    const file = new File(['logo'], 'logo.png', { type: 'image/png' })

    await uploadCompanyLogo({ baseUrl, submodelId: 'urn:company', file, fileName: 'company-logo' })

    expectFileName(sentForm(), 'company-logo')
  })

  it('sends the requested consolidated data file name for a plain Blob', async () => {
    const data = new Blob(['report'], { type: 'application/pdf' })

    await uploadConsolidatedDataFile({ baseUrl, submodelId: 'urn:company', reportIdShort: 'Report', data, fileName: 'report-2025.pdf' })

    expectFileName(sentForm(), 'report-2025.pdf')
  })

  it('falls back to the name of the file without a requested name', async () => {
    const data = new File(['report'], 'annual.pdf', { type: 'application/pdf' })

    await uploadConsolidatedDataFile({ baseUrl, submodelId: 'urn:company', reportIdShort: 'Report', data })

    expectFileName(sentForm(), 'annual.pdf')
  })

  it('falls back to the default name for a plain Blob without a requested name', async () => {
    const data = new Blob(['report'], { type: 'application/pdf' })

    await uploadConsolidatedDataFile({ baseUrl, submodelId: 'urn:company', reportIdShort: 'Report', data })

    expectFileName(sentForm(), 'consolidated-data.pdf')
  })
})

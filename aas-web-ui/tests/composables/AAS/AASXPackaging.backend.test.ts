import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAASXPackaging } from '@/composables/AAS/AASXPackaging'

const mocks = vi.hoisted(() => ({
  getRequest: vi.fn(),
  getAasEndpointById: vi.fn(),
}))

vi.mock('@/composables/AAS/AASHandling', () => ({
  useAASHandling: () => ({
    fetchAasById: vi.fn(),
    getAasEndpointById: mocks.getAasEndpointById,
  }),
}))

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({ fetchSmById: vi.fn() }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({ fetchCdById: vi.fn() }),
}))

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({ determineContentType: vi.fn() }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({ fetchAttachmentFile: vi.fn() }),
}))

vi.mock('@/composables/Client/AASRepositoryClient', () => ({
  useAASRepositoryClient: () => ({ fetchAssetInformation: vi.fn() }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({ getRequest: mocks.getRequest }),
}))

function download (format: 'plain-json' | 'plain-xml' | 'aasx-json' | 'aasx-xml'): Promise<Blob> {
  return useAASXPackaging().downloadViaBackendSerialization('urn:aas:test', ['urn:sm:test'], true, format)
}

describe('backend AAS serialization download', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAasEndpointById.mockResolvedValue('https://env.test/shells/encoded-id')
  })

  it.each([
    ['plain-json', 'application/json'],
    ['plain-xml', 'application/xml'],
    ['aasx-json', 'application/aasx+json'],
    ['aasx-xml', 'application/asset-administration-shell-package+xml'],
  ] as const)('requests %s as %s and keeps the response as a blob', async (format, accept) => {
    const payload = new Blob(['bytes'], { type: accept })
    mocks.getRequest.mockResolvedValue({ success: true, data: payload, status: 200 })

    await expect(download(format)).resolves.toBe(payload)

    const call = mocks.getRequest.mock.calls[0]!
    const path = call[0]
    const headers = call[3] as Headers
    const responseType = call[5]
    expect(path).toMatch(/^https:\/\/env\.test\/serialization\?aasIds=.+&submodelIds=.+&includeConceptDescriptions=true$/)
    expect(headers.get('Accept')).toBe(accept)
    expect(responseType).toBe('blob')
  })

  it('explains that AASX with JSON content may be unsupported when the server refuses it', async () => {
    mocks.getRequest.mockResolvedValue({ success: false, status: 400 })

    await expect(download('aasx-json')).rejects.toThrow(
      /AASX \(JSON content\)\) \(HTTP 400\)\..*application\/aasx\+json.*AASX \(XML content\)/,
    )
  })

  it('reports the status without a compatibility hint for other formats', async () => {
    mocks.getRequest.mockResolvedValue({ success: false, status: 500 })

    await expect(download('aasx-xml')).rejects.toThrow(
      /^Failed to retrieve serialized AAS \(AASX \(XML content\)\) \(HTTP 500\)\.$/,
    )
  })
})

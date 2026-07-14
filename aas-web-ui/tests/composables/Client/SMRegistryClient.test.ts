import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  submodelRegistryUrl: 'https://example.test/submodel-descriptors',
}))

const mockDeps = vi.hoisted(() => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
  putRequest: vi.fn(),
  deleteRequest: vi.fn(),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getSubmodelRegistryURL: mockState.submodelRegistryUrl,
    getSelectedInfrastructure: {
      components: {
        SubmodelRegistry: {
          url: mockState.submodelRegistryUrl,
        },
      },
    },
  }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    getRequest: mockDeps.getRequest,
    postRequest: mockDeps.postRequest,
    putRequest: mockDeps.putRequest,
    deleteRequest: mockDeps.deleteRequest,
  }),
}))

describe('SMRegistryClient.ts reference resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.submodelRegistryUrl = 'https://example.test/submodel-descriptors'
  })

  it('treats a missing descriptor as expected only while resolving an AAS reference', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: false, status: 404 })

    const { base64Encode } = await import('@/utils/EncodeDecodeUtils')
    const { useSMRegistryClient } = await import('@/composables/Client/SMRegistryClient')
    const { fetchSmDescriptorById } = useSMRegistryClient()

    await expect(fetchSmDescriptorById('hidden-submodel', undefined, true)).resolves.toEqual({})

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      `https://example.test/submodel-descriptors/${base64Encode('hidden-submodel')}`,
      'retrieving SM Descriptor',
      false,
      expect.any(Headers),
      { suppressStatuses: [404] },
    )
  })

  it('does not suppress descriptor errors in normal descriptor requests', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: false, status: 404 })

    const { useSMRegistryClient } = await import('@/composables/Client/SMRegistryClient')
    const { fetchSmDescriptorById } = useSMRegistryClient()

    await fetchSmDescriptorById('missing-submodel')

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      expect.any(String),
      'retrieving SM Descriptor',
      false,
      expect.any(Headers),
      {},
    )
  })
})

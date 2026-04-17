import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  aasRegistryUrl: 'https://example.test/shell-descriptors',
}))

const mockDeps = vi.hoisted(() => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
  putRequest: vi.fn(),
  deleteRequest: vi.fn(),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getAASRegistryURL: mockState.aasRegistryUrl,
    getSelectedInfrastructure: {
      components: {
        AASRegistry: {
          url: mockState.aasRegistryUrl,
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

describe('AASRegistryClient pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.aasRegistryUrl = 'https://example.test/shell-descriptors'
  })

  it('passes limit and cursor query params and parses next cursor', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({
      success: true,
      data: {
        result: [{ id: 'aas-1' }],
        paging_metadata: {
          cursor: 'cursor-2',
        },
      },
    })

    const { useAASRegistryClient } = await import('@/composables/Client/AASRegistryClient')
    const { fetchAasDescriptorListPage } = useAASRegistryClient()

    const result = await fetchAasDescriptorListPage({ limit: 100, cursor: 'cursor-1' })

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://example.test/shell-descriptors?limit=100&cursor=cursor-1',
      'retrieving AAS Descriptors page',
      false,
    )
    expect(result.items).toEqual([{ id: 'aas-1' }])
    expect(result.nextCursor).toBe('cursor-2')
    expect(result.hasMore).toBe(true)
  })

  it('returns no continuation when response has no cursor', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({
      success: true,
      data: {
        result: [{ id: 'aas-1' }],
      },
    })

    const { useAASRegistryClient } = await import('@/composables/Client/AASRegistryClient')
    const { fetchAasDescriptorListPage } = useAASRegistryClient()

    const result = await fetchAasDescriptorListPage({ limit: 50 })

    expect(result.items).toEqual([{ id: 'aas-1' }])
    expect(result.nextCursor).toBeUndefined()
    expect(result.hasMore).toBe(false)
  })
})

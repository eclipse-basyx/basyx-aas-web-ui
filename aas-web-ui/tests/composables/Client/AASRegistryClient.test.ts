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

describe('AASRegistryClient.ts pagination contract', () => {
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

  it('appends repeated assetIds query params and ignores blank filters', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({
      success: true,
      data: {
        result: [{ id: 'aas-1' }],
      },
    })

    const { useAASRegistryClient } = await import('@/composables/Client/AASRegistryClient')
    const { fetchAasDescriptorListPage } = useAASRegistryClient()

    await fetchAasDescriptorListPage({
      limit: 25,
      assetIds: [
        { name: 'manufacturerPartId', value: 'PART-001' },
        { name: '', value: 'ignored' },
        { name: 'globalAssetId', value: 'urn:example:asset:product-001' },
      ],
    })

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://example.test/shell-descriptors?limit=25'
      + '&assetIds=eyJuYW1lIjoibWFudWZhY3R1cmVyUGFydElkIiwidmFsdWUiOiJQQVJULTAwMSJ9'
      + '&assetIds=eyJuYW1lIjoiZ2xvYmFsQXNzZXRJZCIsInZhbHVlIjoidXJuOmV4YW1wbGU6YXNzZXQ6cHJvZHVjdC0wMDEifQ',
      'retrieving AAS Descriptors page',
      false,
    )
  })

  it('carries assetIds filters through paged list fetching', async () => {
    mockDeps.getRequest
      .mockResolvedValueOnce({
        success: true,
        data: {
          result: [{ id: 'aas-1' }],
          paging_metadata: {
            cursor: 'cursor-2',
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          result: [{ id: 'aas-2' }],
        },
      })

    const { useAASRegistryClient } = await import('@/composables/Client/AASRegistryClient')
    const { fetchAasDescriptorList } = useAASRegistryClient()

    const result = await fetchAasDescriptorList({
      assetIds: [{ name: 'manufacturerPartId', value: 'PART-001' }],
    })

    expect(result).toEqual([{ id: 'aas-1' }, { id: 'aas-2' }])
    expect(mockDeps.getRequest).toHaveBeenNthCalledWith(
      1,
      'https://example.test/shell-descriptors?limit=1000'
      + '&assetIds=eyJuYW1lIjoibWFudWZhY3R1cmVyUGFydElkIiwidmFsdWUiOiJQQVJULTAwMSJ9',
      'retrieving AAS Descriptors page',
      false,
    )
    expect(mockDeps.getRequest).toHaveBeenNthCalledWith(
      2,
      'https://example.test/shell-descriptors?limit=1000&cursor=cursor-2'
      + '&assetIds=eyJuYW1lIjoibWFudWZhY3R1cmVyUGFydElkIiwidmFsdWUiOiJQQVJULTAwMSJ9',
      'retrieving AAS Descriptors page',
      false,
    )
  })
})

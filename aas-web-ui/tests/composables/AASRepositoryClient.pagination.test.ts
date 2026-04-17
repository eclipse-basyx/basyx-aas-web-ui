import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  aasRepoUrl: 'https://example.test/shells',
}))

const mockDeps = vi.hoisted(() => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
  putRequest: vi.fn(),
  deleteRequest: vi.fn(),
  consumeLastRequestFailureStatus: vi.fn(),
  consumeLastRequestFailureDetails: vi.fn(),
  generateUUIDFromString: vi.fn((value: string) => value),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getAASRepoURL: mockState.aasRepoUrl,
  }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    getRequest: mockDeps.getRequest,
    postRequest: mockDeps.postRequest,
    putRequest: mockDeps.putRequest,
    deleteRequest: mockDeps.deleteRequest,
    consumeLastRequestFailureStatus: mockDeps.consumeLastRequestFailureStatus,
    consumeLastRequestFailureDetails: mockDeps.consumeLastRequestFailureDetails,
  }),
}))

vi.mock('@/composables/IDUtils', () => ({
  useIDUtils: () => ({
    generateUUIDFromString: mockDeps.generateUUIDFromString,
  }),
}))

describe('AASRepositoryClient pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.aasRepoUrl = 'https://example.test/shells'
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

    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    const { fetchAasListPage } = useAASRepositoryClient()

    const result = await fetchAasListPage({ limit: 100, cursor: 'cursor-1' })

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://example.test/shells?limit=100&cursor=cursor-1',
      'retrieving AAS page',
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

    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    const { fetchAasListPage } = useAASRepositoryClient()

    const result = await fetchAasListPage({ limit: 50 })

    expect(result.items).toEqual([{ id: 'aas-1' }])
    expect(result.nextCursor).toBeUndefined()
    expect(result.hasMore).toBe(false)
  })
})

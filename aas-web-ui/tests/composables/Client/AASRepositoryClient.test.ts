import type { InfrastructureConfig } from '@/types/Infrastructure'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  profileEnabled: true,
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
  useInfrastructureStore: () => ({ supportsResourceAccess: () => mockState.profileEnabled,
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

describe('AASRepositoryClient.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.profileEnabled = true
    mockState.aasRepoUrl = 'https://example.test/shells'
  })

  it('does not request capabilities when the ReBAC profile is absent', async () => {
    mockState.profileEnabled = false
    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    expect(await useAASRepositoryClient().fetchAasUpdateCapability('urn:aas')).toBeUndefined()
    expect(mockDeps.getRequest).not.toHaveBeenCalled()
  })

  it.each([
    ['rebac', true],
    ['abac', true],
    ['administrator', true],
    ['none', false],
    ['abac-conditional', undefined],
  ])('derives the AAS update capability from the effective update right granted by %s', async (source, canUpdate) => {
    mockState.aasRepoUrl = 'https://example.test/'
    mockDeps.getRequest.mockResolvedValueOnce({ success: true, data: { rights: [{ action: 'read', source: 'rebac' }, { action: 'update', source }] } })
    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    expect(await useAASRepositoryClient().fetchAasUpdateCapability('urn:aas')).toBe(canUpdate)
    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://example.test/shells/dXJuOmFhcw/$access/effective',
      'checking AAS editing permission',
      true,
      expect.any(Headers),
      { suppressStatuses: [404] },
    )
    expect(mockDeps.putRequest).not.toHaveBeenCalled()
    expect(mockDeps.postRequest).not.toHaveBeenCalled()
  })

  it('denies creation when the shell is hidden', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: false, status: 404 })
    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    expect(await useAASRepositoryClient().fetchAasUpdateCapability('urn:aas')).toBe(false)
  })

  it.each([
    { success: false, status: 401 },
    { success: false, status: 500 },
    { success: false, data: { rights: [{ action: 'update', source: 'rebac' }] } },
    { success: true, data: { rights: 'update' } },
    { success: true, data: {} },
    { success: true },
  ])('does not authorize an unsuccessful or malformed capability response: %j', async response => {
    mockDeps.getRequest.mockResolvedValueOnce(response)
    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    expect(await useAASRepositoryClient().fetchAasUpdateCapability('urn:aas')).toBeUndefined()
  })

  it('fails closed on network errors and missing resource context', async () => {
    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    const client = useAASRepositoryClient()
    expect(await client.fetchAasUpdateCapability('')).toBeUndefined()
    expect(mockDeps.getRequest).not.toHaveBeenCalled()
    mockDeps.getRequest.mockRejectedValueOnce(new Error('network'))
    expect(await client.fetchAasUpdateCapability('urn:aas')).toBeUndefined()
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

  it('reads the AAS page from the given infrastructure with its credentials', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: true, data: { result: [{ id: 'aas-1' }] } })
    const infrastructure: InfrastructureConfig = {
      id: 'infra-2',
      name: 'Other Infrastructure',
      template: 'mono-repo',
      components: {
        AASDiscovery: { url: '' },
        AASRegistry: { url: '' },
        SubmodelRegistry: { url: '' },
        AASRepo: { url: 'https://other.test/' },
        SubmodelRepo: { url: 'https://other.test/' },
        ConceptDescriptionRepo: { url: 'https://other.test/' },
        CompanyLookup: { url: '' },
      },
    }

    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    const { fetchAasListPage, getAasEndpointById } = useAASRepositoryClient()

    const result = await fetchAasListPage({ limit: 10, infrastructure })

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://other.test/shells?limit=10',
      'retrieving AAS page',
      false,
      expect.any(Headers),
      undefined,
      'auto',
      { infrastructure },
    )
    expect(result.items).toEqual([{ id: 'aas-1' }])
    expect(getAasEndpointById('urn:aas', infrastructure)).toBe('https://other.test/shells/dXJuOmFhcw')
  })

  it('reads the repository description of the given infrastructure without affecting its login state', async () => {
    const description = { profiles: ['https://basyx.org/aas/API/3/2/AssetAdministrationShellRepositoryServiceSpecification/SSP-001'] }
    mockDeps.getRequest.mockResolvedValueOnce({ success: true, data: description })
    const infrastructure = { id: 'infra-2', template: 'identifiable', components: { AASRepo: { url: 'https://other.test/shells/' } } } as any

    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    await expect(useAASRepositoryClient().fetchAasRepositoryDescription(infrastructure)).resolves.toEqual(description)

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://other.test/description',
      'retrieving AAS Repository description',
      true,
      expect.any(Headers),
      undefined,
      'auto',
      { infrastructure, isolateAuthenticationFailures: true },
    )
  })

  it('returns no repository description when the request fails', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: false, status: 404 })

    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    await expect(useAASRepositoryClient().fetchAasRepositoryDescription()).resolves.toBeNull()
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

  it('returns no selectable AAS for a structured repository 404', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: false, status: 404 })

    const { useAASRepositoryClient } = await import('@/composables/Client/AASRepositoryClient')
    const { fetchAas } = useAASRepositoryClient()

    await expect(fetchAas('https://example.test/shells/protected')).resolves.toEqual({})
  })
})

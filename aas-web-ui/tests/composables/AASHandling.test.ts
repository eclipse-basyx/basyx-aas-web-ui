import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDeps = vi.hoisted(() => ({
  fetchAas: vi.fn(),
  fetchAasDescriptorListPage: vi.fn(),
  getAasEndpointByIdFromRegistry: vi.fn(),
  fetchSmById: vi.fn(),
  getAasEndpointById: vi.fn(() => 'https://example.test/shells/motor-aas'),
  extractEndpointHref: vi.fn((_descriptor, _interfaceName, preferredEndpoint) => preferredEndpoint),
  extractIdFromReference: vi.fn((reference: { id: string }) => reference.id),
}))

vi.mock('@/composables/Client/AASRegistryClient', () => ({
  useAASRegistryClient: () => ({
    fetchAasDescriptorById: vi.fn(),
    fetchAasDescriptorListPage: mockDeps.fetchAasDescriptorListPage,
    fetchAasDescriptorList: vi.fn(),
    getAasEndpointById: mockDeps.getAasEndpointByIdFromRegistry,
  }),
}))

vi.mock('@/composables/Client/AASRepositoryClient', () => ({
  useAASRepositoryClient: () => ({
    fetchAasListPage: vi.fn(),
    fetchAasList: vi.fn(),
    fetchAas: mockDeps.fetchAas,
    getAasEndpointById: mockDeps.getAasEndpointById,
    aasIsAvailable: vi.fn(),
    getSubmodelRefs: vi.fn(),
    deleteAas: vi.fn(),
  }),
}))

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({
    fetchSmDescriptor: vi.fn(),
    fetchSmById: mockDeps.fetchSmById,
  }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({
    getSmIdOfSmePath: vi.fn(),
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    dispatchSelectedAAS: vi.fn(),
  }),
}))

vi.mock('@/utils/AAS/DescriptorUtils', () => ({
  extractEndpointHref: mockDeps.extractEndpointHref,
}))

vi.mock('@/utils/AAS/ReferenceUtil', () => ({
  extractId: mockDeps.extractIdFromReference,
}))

vi.mock('@/utils/DateUtils', () => ({
  formatDate: vi.fn(),
}))

describe('AASHandling.ts filtered Submodel references', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('omits an unavailable referenced Submodel instead of creating an unavailable tree entry', async () => {
    mockDeps.fetchAas.mockResolvedValue({
      id: 'motor-aas',
      submodels: [{ id: 'public-submodel' }, { id: 'hidden-submodel' }],
    })
    mockDeps.fetchSmById.mockImplementation(async (id: string) => (
      id === 'public-submodel' ? { id, idShort: 'Nameplate' } : {}
    ))

    const { useAASHandling } = await import('@/composables/AAS/AASHandling')
    const { fetchAasSmListById } = useAASHandling()

    await expect(fetchAasSmListById('motor-aas')).resolves.toEqual([
      { id: 'public-submodel', idShort: 'Nameplate' },
    ])
    expect(mockDeps.fetchSmById).toHaveBeenNthCalledWith(
      1,
      'public-submodel',
      {
        aasId: 'motor-aas',
        setData: true,
        suppressNotFound: true,
      },
    )
    expect(mockDeps.fetchSmById).toHaveBeenNthCalledWith(
      2,
      'hidden-submodel',
      {
        aasId: 'motor-aas',
        setData: true,
        suppressNotFound: true,
      },
    )
  })
})

describe('AASHandling.ts descriptor endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the configured repository shell URL to select among advertised endpoints', async () => {
    const descriptor = {
      id: 'motor-aas',
      endpoints: [
        { interface: 'AAS-3.0', protocolInformation: { href: 'https://internal.example/shell' } },
        { interface: 'AAS-3.0', protocolInformation: { href: 'https://example.test/shells/motor-aas' } },
      ],
    }
    mockDeps.fetchAasDescriptorListPage.mockResolvedValue({
      items: [descriptor],
      hasMore: false,
    })

    const { useAASHandling } = await import('@/composables/AAS/AASHandling')
    const result = await useAASHandling().fetchAasShellListPage({ source: 'registry' })

    expect(mockDeps.extractEndpointHref).toHaveBeenCalledWith(
      descriptor,
      'AAS-3.0',
      'https://example.test/shells/motor-aas',
    )
    expect(result.items[0].path).toBe('https://example.test/shells/motor-aas')
  })

  it('passes the configured repository endpoint to registry endpoint resolution', async () => {
    mockDeps.getAasEndpointByIdFromRegistry.mockResolvedValue('https://example.test/shells/motor-aas')

    const { useAASHandling } = await import('@/composables/AAS/AASHandling')
    const result = await useAASHandling().getAasEndpointById('motor-aas')

    expect(mockDeps.getAasEndpointByIdFromRegistry).toHaveBeenCalledWith(
      'motor-aas',
      undefined,
      'https://example.test/shells/motor-aas',
    )
    expect(result).toBe('https://example.test/shells/motor-aas')
  })
})

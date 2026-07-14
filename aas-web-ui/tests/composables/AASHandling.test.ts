import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDeps = vi.hoisted(() => ({
  fetchAas: vi.fn(),
  fetchSmById: vi.fn(),
  getAasEndpointById: vi.fn(() => 'https://example.test/shells/motor-aas'),
  extractIdFromReference: vi.fn((reference: { id: string }) => reference.id),
}))

vi.mock('@/composables/Client/AASRegistryClient', () => ({
  useAASRegistryClient: () => ({
    fetchAasDescriptorById: vi.fn(),
    fetchAasDescriptorListPage: vi.fn(),
    fetchAasDescriptorList: vi.fn(),
    getAasEndpointById: vi.fn(),
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
  extractEndpointHref: vi.fn(),
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
      false,
      true,
      'motor-aas',
      true,
    )
    expect(mockDeps.fetchSmById).toHaveBeenNthCalledWith(
      2,
      'hidden-submodel',
      false,
      true,
      'motor-aas',
      true,
    )
  })
})

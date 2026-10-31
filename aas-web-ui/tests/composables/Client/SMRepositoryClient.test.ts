import type { InfrastructureConfig } from '@/types/Infrastructure'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDeps = vi.hoisted(() => ({
  getRequest: vi.fn(),
  selectedInfrastructure: { id: 'infra-1', template: 'full' } as any,
  selectedAas: {} as any,
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getSubmodelRepoURL: 'https://selected.test/submodels',
    getAASRepoURL: 'https://selected.test/shells',
    getSelectedInfrastructure: mockDeps.selectedInfrastructure,
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: mockDeps.selectedAas,
  }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    getRequest: mockDeps.getRequest,
    postRequest: vi.fn(),
    putRequest: vi.fn(),
    deleteRequest: vi.fn(),
    consumeLastRequestFailureStatus: vi.fn(),
    consumeLastRequestFailureDetails: vi.fn(),
  }),
}))

vi.mock('@/composables/IDUtils', () => ({
  useIDUtils: () => ({
    generateUUIDFromString: (value: string) => value,
  }),
}))

function createInfrastructure (template: InfrastructureConfig['template'], url: string): InfrastructureConfig {
  return {
    id: 'infra-2',
    name: 'Other Infrastructure',
    template,
    components: {
      AASDiscovery: { url: '' },
      AASRegistry: { url: '' },
      SubmodelRegistry: { url: '' },
      AASRepo: { url },
      SubmodelRepo: { url },
      ConceptDescriptionRepo: { url },
      CompanyLookup: { url: '' },
    },
  }
}

describe('SMRepositoryClient.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeps.selectedAas = { id: 'urn:selected', path: 'https://selected.test/shells/c2VsZWN0ZWQ' }
  })

  it('reads the SM from the Submodel Repository of the given infrastructure with its credentials', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: true, data: { id: 'urn:sm', modelType: 'Submodel' } })
    const infrastructure = createInfrastructure('mono-repo', 'https://other.test/')

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const sm = await useSMRepositoryClient().fetchSmById('urn:sm', 'urn:aas', infrastructure)

    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://other.test/submodels/dXJuOnNt',
      'retrieving SM',
      true,
      expect.any(Headers),
      undefined,
      'auto',
      { infrastructure },
    )
    expect(sm.id).toBe('urn:sm')
  })

  it('reads the SM through the shell superpath of the given AAS, not the selected one', async () => {
    const infrastructure = createInfrastructure('identifiable', 'https://other.test/shells/')

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const smEndpoint = useSMRepositoryClient().getSmEndpointById('urn:sm', 'urn:aas', infrastructure)

    expect(smEndpoint).toBe('https://other.test/shells/dXJuOmFhcw/submodels/dXJuOnNt')
  })

  it('keeps using the selected infrastructure when no infrastructure is given', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: true, data: { id: 'urn:sm', modelType: 'Submodel' } })

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    await useSMRepositoryClient().fetchSmById('urn:sm')

    expect(mockDeps.getRequest).toHaveBeenCalledWith('https://selected.test/submodels/dXJuOnNt', 'retrieving SM', true)
  })
})

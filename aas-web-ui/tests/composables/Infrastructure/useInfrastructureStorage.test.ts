import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfrastructureStorage } from '@/composables/Infrastructure/useInfrastructureStorage'

const mockDeps = vi.hoisted(() => ({
  loadInfrastructureConfig: vi.fn(),
  dispatchSnackbar: vi.fn(),
  authenticateOAuth2ClientCredentials: vi.fn(),
}))

vi.mock('@/composables/Infrastructure/useInfrastructureConfigLoader', () => ({
  useInfrastructureConfigLoader: () => ({
    loadInfrastructureConfig: mockDeps.loadInfrastructureConfig,
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: mockDeps.dispatchSnackbar,
  }),
}))

vi.mock('@/composables/Auth/OAuth2Auth', () => ({
  authenticateOAuth2ClientCredentials: mockDeps.authenticateOAuth2ClientCredentials,
}))

describe('useInfrastructureStorage.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    mockDeps.loadInfrastructureConfig.mockResolvedValue(null)
  })

  it('normalizes localStorage infrastructures without template to full', async () => {
    window.localStorage.setItem('basyxInfrastructures', JSON.stringify({
      selectedInfrastructureId: 'legacy-infra',
      infrastructures: [
        {
          id: 'legacy-infra',
          name: 'Legacy',
          components: {
            AASRepo: { url: 'https://aas-repo.example' },
          },
          auth: { securityType: 'No Authentication' },
        },
      ],
    }))

    const { loadInfrastructuresFromStorage } = useInfrastructureStorage()
    const result = await loadInfrastructuresFromStorage({})
    const infrastructure = result.infrastructures[0]

    expect(infrastructure.template).toBe('full')
    expect(infrastructure.components.AASRepo.url).toBe('https://aas-repo.example')
    expect(infrastructure.components.AASDiscovery.url).toBe('')
    expect(infrastructure.components.AASRegistry.hasDiscoveryIntegration).toBe(true)
    expect(infrastructure.components.SubmodelRepo.hasRegistryIntegration).toBe(true)
    expect(result.selectedInfrastructureId).toBe('legacy-infra')
  })

  it('persists normalized template values when saving older infrastructure objects', () => {
    const { saveInfrastructuresToStorage } = useInfrastructureStorage()

    saveInfrastructuresToStorage([
      {
        id: 'stored-infra',
        name: 'Stored',
        components: {
          AASDiscovery: { url: '' },
          AASRegistry: { url: '' },
          SubmodelRegistry: { url: '' },
          AASRepo: { url: 'https://aas-repo.example' },
          SubmodelRepo: { url: '' },
          ConceptDescriptionRepo: { url: '' },
          CompanyLookup: { url: '' },
        },
        auth: { securityType: 'No Authentication' },
      } as any,
    ], 'stored-infra')

    const stored = JSON.parse(window.localStorage.getItem('basyxInfrastructures') ?? '{}')
    expect(stored.infrastructures[0].template).toBe('full')
  })

  it('persists Catena-X EDC proxy metadata only for Catena-X infrastructures', () => {
    const { saveInfrastructuresToStorage } = useInfrastructureStorage()

    saveInfrastructuresToStorage([
      {
        id: 'catena-x',
        name: 'Catena-X',
        template: 'catena-x',
        components: {
          AASDiscovery: { url: 'https://dtr.example' },
          AASRegistry: { url: 'https://dtr.example' },
          SubmodelRegistry: { url: '' },
          AASRepo: { url: '' },
          SubmodelRepo: { url: 'https://submodel-service.example' },
          ConceptDescriptionRepo: { url: '' },
          CompanyLookup: { url: '' },
        },
        catenaX: {
          edc: {
            proxyId: ' default ',
            defaultCounterPartyId: ' TEST_COUNTERPARTY_ID ',
            defaultCounterPartyAddress: ' https://counterparty-dsp.test/api/v1/dsp ',
          },
        },
        auth: { securityType: 'No Authentication' },
      },
      {
        id: 'full',
        name: 'Full',
        template: 'full',
        components: {
          AASDiscovery: { url: '' },
          AASRegistry: { url: '' },
          SubmodelRegistry: { url: '' },
          AASRepo: { url: '' },
          SubmodelRepo: { url: '' },
          ConceptDescriptionRepo: { url: '' },
          CompanyLookup: { url: '' },
        },
        catenaX: {
          edc: { proxyId: 'stale' },
        },
        auth: { securityType: 'No Authentication' },
      },
    ], 'catena-x')

    const stored = JSON.parse(window.localStorage.getItem('basyxInfrastructures') ?? '{}')
    expect(stored.infrastructures[0].catenaX).toEqual({
      accessMode: 'edc',
      edc: {
        proxyId: 'default',
        defaultCounterPartyId: 'TEST_COUNTERPARTY_ID',
        defaultCounterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        defaultPartnerId: 'test-counterparty-id-https-counterparty-dsp-test-api-v1-dsp',
        partners: [
          {
            id: 'test-counterparty-id-https-counterparty-dsp-test-api-v1-dsp',
            counterPartyId: 'TEST_COUNTERPARTY_ID',
            counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
          },
        ],
      },
    })
    expect(stored.infrastructures[1].catenaX).toBeUndefined()
  })
})

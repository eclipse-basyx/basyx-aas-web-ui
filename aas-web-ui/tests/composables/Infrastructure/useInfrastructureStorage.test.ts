import type { InfrastructureConfig } from '@/types/Infrastructure'
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

function createInfrastructure (id: string, isDefault: boolean): InfrastructureConfig {
  return {
    id,
    name: id,
    template: 'full',
    isDefault,
    components: {
      AASDiscovery: { url: '' },
      AASRegistry: { url: '' },
      SubmodelRegistry: { url: '' },
      AASRepo: { url: `https://${id}.example` },
      SubmodelRepo: { url: '' },
      ConceptDescriptionRepo: { url: '' },
      CompanyLookup: { url: '' },
    },
    auth: { securityType: 'No Authentication' },
  }
}

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

  it('creates an environment infrastructure with its Company Lookup endpoint', async () => {
    const { createDefaultInfrastructureFromEnv } = useInfrastructureStorage()

    const infrastructure = await createDefaultInfrastructureFromEnv({
      companyLookupPath: 'https://company-lookup.example',
    })

    expect(infrastructure.components.CompanyLookup.url).toBe('https://company-lookup.example')
  })

  it('reuses a locked Company Lookup environment infrastructure from storage', async () => {
    window.localStorage.setItem('basyxInfrastructures', JSON.stringify({
      selectedInfrastructureId: 'stored-company-lookup',
      infrastructures: [
        {
          id: 'stored-company-lookup',
          name: 'Company Lookup',
          template: 'full',
          isDefault: true,
          components: {
            AASDiscovery: { url: '' },
            AASRegistry: { url: '' },
            SubmodelRegistry: { url: '' },
            AASRepo: { url: '' },
            SubmodelRepo: { url: '' },
            ConceptDescriptionRepo: { url: '' },
            CompanyLookup: { url: 'https://company-lookup.example' },
          },
          auth: { securityType: 'No Authentication' },
          token: { accessToken: 'stored-token' },
        },
      ],
    }))

    const { loadInfrastructuresFromStorage } = useInfrastructureStorage()
    const result = await loadInfrastructuresFromStorage({
      companyLookupPath: 'https://company-lookup.example',
      endpointConfigAvailable: false,
    })

    expect(result.selectedInfrastructureId).toBe('stored-company-lookup')
    expect(result.infrastructures).toHaveLength(1)
    expect(result.infrastructures[0].components.CompanyLookup.url).toBe('https://company-lookup.example')
    expect(result.infrastructures[0].token?.accessToken).toBe('stored-token')
  })

  it('ignores unresolved production placeholders when deciding whether env config overrides YAML', async () => {
    mockDeps.loadInfrastructureConfig.mockResolvedValue({
      infrastructures: [
        {
          id: 'yaml_production',
          name: 'Production',
          template: 'full',
          components: {
            AASDiscovery: { url: 'https://discovery.example' },
            AASRegistry: { url: 'https://aas-registry.example' },
            SubmodelRegistry: { url: 'https://submodel-registry.example' },
            AASRepo: { url: 'https://aas-repository.example' },
            SubmodelRepo: { url: 'https://submodel-repository.example' },
            ConceptDescriptionRepo: { url: 'https://cd-repository.example' },
            CompanyLookup: { url: 'https://company-lookup.example' },
          },
          auth: { securityType: 'No Authentication' },
        },
      ],
      defaultInfrastructureId: 'yaml_production',
    })

    const { loadInfrastructuresFromStorage } = useInfrastructureStorage()
    const result = await loadInfrastructuresFromStorage({
      companyLookupPath: '/__COMPANY_LOOKUP_PATH_PLACEHOLDER__/',
      endpointConfigAvailable: false,
    })

    expect(mockDeps.loadInfrastructureConfig).toHaveBeenCalledOnce()
    expect(result.selectedInfrastructureId).toBe('yaml_production')
    expect(result.infrastructures[0].components).toMatchObject({
      AASDiscovery: { url: 'https://discovery.example' },
      AASRepo: { url: 'https://aas-repository.example' },
      CompanyLookup: { url: 'https://company-lookup.example' },
    })
  })

  it('uses an updated default from a locked YAML configuration', async () => {
    const storedFoo = createInfrastructure('yaml_foo', true)
    const storedBar = createInfrastructure('yaml_bar', false)

    window.localStorage.setItem('basyxInfrastructures', JSON.stringify({
      selectedInfrastructureId: storedFoo.id,
      infrastructures: [storedFoo, storedBar],
    }))

    const yamlFoo = createInfrastructure('yaml_foo', false)
    const yamlBar = createInfrastructure('yaml_bar', true)
    mockDeps.loadInfrastructureConfig.mockResolvedValue({
      infrastructures: [yamlFoo, yamlBar],
      defaultInfrastructureId: yamlBar.id,
    })

    const { loadInfrastructuresFromStorage } = useInfrastructureStorage()
    const result = await loadInfrastructuresFromStorage({
      endpointConfigAvailable: false,
    })

    expect(result.selectedInfrastructureId).toBe(yamlBar.id)
  })

  it('preserves a stored selection while the locked YAML default is unchanged', async () => {
    const yamlFoo = createInfrastructure('yaml_foo', false)
    const yamlBar = createInfrastructure('yaml_bar', true)
    mockDeps.loadInfrastructureConfig.mockResolvedValue({
      infrastructures: [yamlFoo, yamlBar],
      defaultInfrastructureId: yamlBar.id,
    })

    const {
      loadInfrastructuresFromStorage,
      saveInfrastructuresToStorage,
    } = useInfrastructureStorage()
    saveInfrastructuresToStorage([yamlFoo, yamlBar], yamlFoo.id)

    const result = await loadInfrastructuresFromStorage({
      endpointConfigAvailable: false,
    })

    expect(result.selectedInfrastructureId).toBe(yamlFoo.id)
  })

  it('preserves a legacy stored selection while the locked YAML default is unchanged', async () => {
    const storedFoo = createInfrastructure('yaml_foo', false)
    const storedBar = createInfrastructure('yaml_bar', true)

    window.localStorage.setItem('basyxInfrastructures', JSON.stringify({
      selectedInfrastructureId: storedFoo.id,
      infrastructures: [storedFoo, storedBar],
    }))

    const yamlFoo = createInfrastructure('yaml_foo', false)
    const yamlBar = createInfrastructure('yaml_bar', true)
    mockDeps.loadInfrastructureConfig.mockResolvedValue({
      infrastructures: [yamlFoo, yamlBar],
      defaultInfrastructureId: yamlBar.id,
    })

    const { loadInfrastructuresFromStorage } = useInfrastructureStorage()
    const result = await loadInfrastructuresFromStorage({
      endpointConfigAvailable: false,
    })

    expect(result.selectedInfrastructureId).toBe(yamlFoo.id)
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

  it('preserves configured partner metadata when it matches the legacy default', () => {
    const { saveInfrastructuresToStorage } = useInfrastructureStorage()
    const infrastructure = createInfrastructure('catena-x', true)
    infrastructure.template = 'catena-x'
    infrastructure.catenaX = {
      accessMode: 'edc',
      edc: {
        proxyId: 'default',
        defaultPartnerId: 'partner-a',
        defaultCounterPartyId: 'BPNL000000000AAA',
        defaultCounterPartyAddress: 'https://partner-a.example/api/v1/dsp',
        partners: [
          {
            id: 'partner-a',
            name: 'Partner A',
            counterPartyId: 'BPNL000000000AAA',
            counterPartyAddress: 'https://partner-a.example/api/v1/dsp',
          },
          {
            id: 'partner-b',
            name: 'Partner B',
            counterPartyId: 'BPNL000000000BBB',
            counterPartyAddress: 'https://partner-b.example/api/v1/dsp',
          },
        ],
      },
    }

    saveInfrastructuresToStorage([infrastructure], infrastructure.id)

    const stored = JSON.parse(window.localStorage.getItem('basyxInfrastructures') ?? '{}')
    expect(stored.infrastructures[0].catenaX.edc).toEqual({
      proxyId: 'default',
      defaultPartnerId: 'partner-a',
      defaultCounterPartyId: 'BPNL000000000AAA',
      defaultCounterPartyAddress: 'https://partner-a.example/api/v1/dsp',
      partners: [
        {
          id: 'partner-a',
          name: 'Partner A',
          counterPartyId: 'BPNL000000000AAA',
          counterPartyAddress: 'https://partner-a.example/api/v1/dsp',
        },
        {
          id: 'partner-b',
          name: 'Partner B',
          counterPartyId: 'BPNL000000000BBB',
          counterPartyAddress: 'https://partner-b.example/api/v1/dsp',
        },
      ],
    })
  })
})

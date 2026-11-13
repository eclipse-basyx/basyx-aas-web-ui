import type { BaSyxComponentKey } from '@/types/BaSyx'
import type { ComponentConfig, InfrastructureConfig } from '@/types/Infrastructure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useComponentConnectionTesting } from '@/composables/Infrastructure/useComponentConnectionTesting'

const mocks = vi.hoisted(() => {
  const componentKeys = [
    'AASDiscovery',
    'AASRegistry',
    'SubmodelRegistry',
    'AASRepo',
    'SubmodelRepo',
    'ConceptDescriptionRepo',
    'CompanyLookup',
  ] as const

  const components = Object.fromEntries(
    componentKeys.map(key => [key, { url: `${key}-original`, connected: null }]),
  ) as Record<BaSyxComponentKey, { url: string, connected: boolean | null }>

  return {
    components,
    connectResolvers: {} as Record<string, () => void>,
    dispatchIsTestingConnections: vi.fn(),
    probeComponentConnection: vi.fn((componentKey: BaSyxComponentKey) =>
      new Promise<boolean>(resolve => {
        const resolver = (): void => {
          resolve(true)
        }
        mocks.connectResolvers[componentKey] = resolver
      })),
  }
})

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getBasyxComponents: mocks.components,
    probeComponentConnection: mocks.probeComponentConnection,
    dispatchIsTestingConnections: mocks.dispatchIsTestingConnections,
  }),
}))

function createComponents (): Record<BaSyxComponentKey, ComponentConfig> {
  return {
    AASDiscovery: { url: '' },
    AASRegistry: { url: '' },
    SubmodelRegistry: { url: '' },
    AASRepo: { url: 'https://aas-env.example' },
    SubmodelRepo: { url: '' },
    ConceptDescriptionRepo: { url: '' },
    CompanyLookup: { url: '' },
  }
}

function createInfrastructure (): InfrastructureConfig {
  return {
    id: 'draft-infrastructure',
    name: 'Draft infrastructure',
    template: 'mono-repo',
    auth: {
      securityType: 'Bearer Token',
      bearerToken: { token: 'draft-token' },
    },
    components: createComponents(),
  }
}

async function flushPromises (): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

describe('useComponentConnectionTesting', () => {
  beforeEach(() => {
    mocks.dispatchIsTestingConnections.mockClear()
    mocks.probeComponentConnection.mockClear()
    mocks.connectResolvers = {}

    for (const [componentKey, component] of Object.entries(mocks.components)) {
      component.url = `${componentKey}-original`
      component.connected = null
    }
  })

  it('keeps the global testing flag active until all grouped component tests finish', async () => {
    const connectionTesting = useComponentConnectionTesting()

    const testPromise = connectionTesting.testEndpointField(
      'mono-repo',
      'AASEnvironment',
      createComponents(),
    )

    expect(mocks.probeComponentConnection).toHaveBeenCalledTimes(3)
    expect(mocks.dispatchIsTestingConnections).toHaveBeenLastCalledWith(true)

    mocks.connectResolvers.AASRepo()
    await flushPromises()

    expect(mocks.dispatchIsTestingConnections).toHaveBeenLastCalledWith(true)

    mocks.connectResolvers.SubmodelRepo()
    mocks.connectResolvers.ConceptDescriptionRepo()
    await testPromise

    expect(mocks.dispatchIsTestingConnections).toHaveBeenLastCalledWith(false)
    expect(mocks.components.AASRepo.url).toBe('AASRepo-original')
    expect(mocks.components.SubmodelRepo.url).toBe('SubmodelRepo-original')
    expect(mocks.components.ConceptDescriptionRepo.url).toBe('ConceptDescriptionRepo-original')
  })

  it('passes the edited infrastructure to every grouped component probe', async () => {
    const connectionTesting = useComponentConnectionTesting()
    const draftInfrastructure = createInfrastructure()

    const testPromise = connectionTesting.testEndpointField(
      draftInfrastructure,
      'AASEnvironment',
      draftInfrastructure.components,
    )

    expect(mocks.probeComponentConnection).toHaveBeenCalledTimes(3)
    for (const key of ['AASRepo', 'SubmodelRepo', 'ConceptDescriptionRepo'] as const) {
      expect(mocks.probeComponentConnection).toHaveBeenCalledWith(key, 'https://aas-env.example', draftInfrastructure)
      mocks.connectResolvers[key]()
    }
    await testPromise
  })

  it('never replaces a saved endpoint while testing and cannot restore an old URL after Save', async () => {
    const testing = useComponentConnectionTesting()
    const saved = mocks.components.AASRepo
    const original = { ...saved }
    const request = testing.testComponentConnection('AASRepo', 'https://draft.example', createInfrastructure())

    expect(saved).toEqual(original)
    saved.url = 'https://new-saved.example'
    mocks.connectResolvers.AASRepo()
    await request

    expect(saved.url).toBe('https://new-saved.example')
    expect(saved.connected).toBeNull()
    expect(testing.componentConnectionStatus.value.AASRepo).toBe(true)
  })
})

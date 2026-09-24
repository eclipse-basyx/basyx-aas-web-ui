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
    connectComponent: vi.fn((componentKey: BaSyxComponentKey) =>
      new Promise<void>(resolve => {
        const resolver = (): void => {
          components[componentKey].connected = true
          resolve()
        }
        mocks.connectResolvers[componentKey] = resolver
      })),
  }
})

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getBasyxComponents: mocks.components,
    connectComponent: mocks.connectComponent,
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
    mocks.connectComponent.mockClear()
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

    expect(mocks.connectComponent).toHaveBeenCalledTimes(3)
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

    expect(mocks.connectComponent).toHaveBeenCalledTimes(3)
    for (const key of ['AASRepo', 'SubmodelRepo', 'ConceptDescriptionRepo'] as const) {
      expect(mocks.connectComponent).toHaveBeenCalledWith(key, draftInfrastructure)
      mocks.connectResolvers[key]()
    }
    await testPromise
  })
})

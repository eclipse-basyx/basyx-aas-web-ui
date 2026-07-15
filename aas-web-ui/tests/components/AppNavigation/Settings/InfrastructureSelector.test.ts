import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InfrastructureSelector from '@/components/AppNavigation/Settings/InfrastructureSelector.vue'

const mocks = vi.hoisted(() => ({
  events: [] as string[],
  dispatchUrlQuery: vi.fn(),
  dispatchRouteTransition: vi.fn(),
  dispatchSelectInfrastructure: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getEndpointConfigAvailable: false,
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getInfrastructures: [
      { id: 'infra-1', name: 'Infrastructure 1', isDefault: true },
      { id: 'infra-2', name: 'Infrastructure 2', isDefault: false },
    ],
    getBasyxComponents: {
      AASDiscovery: { connected: null },
      AASRegistry: { connected: null },
      SubmodelRegistry: { connected: null },
      AASRepo: { connected: null },
      SubmodelRepo: { connected: null },
      ConceptDescriptionRepo: { connected: null },
    },
    getSelectedInfrastructure: { template: 'mono-all' },
    getSelectedInfrastructureId: 'infra-1',
    dispatchSelectInfrastructure: mocks.dispatchSelectInfrastructure,
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchUrlQuery: mocks.dispatchUrlQuery,
    dispatchRouteTransition: mocks.dispatchRouteTransition,
  }),
}))

describe('InfrastructureSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.events.length = 0
    mocks.dispatchRouteTransition.mockImplementation((transition: string | null) => {
      mocks.events.push(transition ? `begin-${transition}` : 'end-transition')
    })
    mocks.replace.mockImplementation(async () => {
      mocks.events.push('clear-route')
    })
    mocks.push.mockImplementation(async () => {
      mocks.events.push('clear-route')
    })
    mocks.dispatchSelectInfrastructure.mockImplementation(async () => {
      mocks.events.push('select-infrastructure')
    })
  })

  it('clears a selected AAS and submodel route before loading the next infrastructure', async () => {
    const wrapper = mount(InfrastructureSelector, {
      global: {
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-list-subheader': true,
          'v-select': {
            emits: ['update:modelValue'],
            template: '<button data-testid="select-infrastructure" @click="$emit(\'update:modelValue\', \'infra-2\')"><slot /></button>',
          },
          'v-icon': true,
          'v-btn': true,
          'v-tooltip': true,
        },
      },
    })

    await wrapper.get('[data-testid="select-infrastructure"]').trigger('click')
    await flushPromises()

    expect(mocks.replace).toHaveBeenCalledWith({ query: {} })
    expect(mocks.dispatchUrlQuery).toHaveBeenCalledWith({})
    expect(mocks.dispatchSelectInfrastructure).toHaveBeenCalledWith('infra-2')
    expect(mocks.events).toEqual([
      'begin-infrastructure-switch',
      'clear-route',
      'end-transition',
      'select-infrastructure',
    ])
  })
})

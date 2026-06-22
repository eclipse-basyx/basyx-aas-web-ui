import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SubmodelElementViewAndVisualization from '@/components/SubmodelElementViewAndVisualization.vue'

const mocks = vi.hoisted(() => ({
  route: {
    name: 'AASSubmodelViewer',
    query: { view: 'SMEView' } as Record<string, string>,
  },
  replace: vi.fn(),
  selectedAAS: { id: 'aas-1' } as Record<string, unknown>,
  selectedNode: {
    modelType: 'Submodel',
    idShort: 'Nameplate',
    path: 'https://example.test/submodels/nameplate',
  } as Record<string, unknown>,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({
    replace: mocks.replace,
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: mocks.selectedAAS,
    getSelectedNode: mocks.selectedNode,
  }),
}))

const slotStub = {
  template: '<div><slot /></div>',
}

const buttonStub = {
  props: ['value'],
  template: '<button :value="value"><slot /></button>',
}

function mountComponent () {
  return mount(SubmodelElementViewAndVisualization, {
    global: {
      stubs: {
        'v-container': slotStub,
        'v-card': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-btn-toggle': slotStub,
        'v-btn': buttonStub,
        'v-icon': slotStub,
        'v-divider': true,
        'v-empty-state': {
          props: ['title', 'text'],
          template: '<div>{{ title }} {{ text }}</div>',
        },
        'SubmodelElementView': {
          template: '<div>SME View Stub</div>',
        },
        'SubmodelElementVisualization': {
          template: '<div>Visualization View Stub</div>',
        },
        'SubmodelElementJSONView': {
          template: '<div>JSON View Stub</div>',
        },
        'SubmodelElementUMLView': {
          template: '<div>UML View Stub</div>',
        },
      },
    },
  })
}

describe('SubmodelElementViewAndVisualization', () => {
  const routeNames = ['AASSubmodelViewer', 'AASViewer', 'AASEditor', 'SMViewer', 'SMEditor']
  const routeQueryViews = ['SMEView', 'Visualization', 'JSONView', 'UMLView']

  for (const routeName of routeNames) {
    describe(`route: ${routeName}`, () => {
      for (const routeQueryView of routeQueryViews) {
        it(`renders the ${routeQueryView} tab and selected ${routeQueryView} view from the query parameter`, () => {
          mocks.route.name = routeName
          mocks.route.query = { view: routeQueryView }
          mocks.selectedAAS = { id: 'aas-1' }
          mocks.selectedNode = {
            modelType: 'Submodel',
            idShort: 'Nameplate',
            path: 'https://example.test/submodels/nameplate',
          }

          const wrapper = mountComponent()

          expect(wrapper.text()).toContain(routeQueryView.replace('View', ''))
          expect(wrapper.text()).toContain(`${routeQueryView.replace('View', '')} View Stub`)
        })

        it('keeps the existing empty state when no Submodel/SubmodelElement is selected', () => {
          mocks.route.name = routeName
          mocks.route.query = { view: routeQueryView }
          mocks.selectedAAS = { id: 'aas-1' }
          mocks.selectedNode = {}

          const wrapper = mountComponent()

          expect(wrapper.text()).toContain('No selected Submodel / Submodel Element')
        })

        it('keeps the existing empty state when no AAS is selected', () => {
          mocks.route.name = routeName
          mocks.route.query = { view: routeQueryView }
          mocks.selectedAAS = {}
          mocks.selectedNode = {}

          const wrapper = mountComponent()

          if (['AASSubmodelViewer', 'AASViewer', 'AASEditor'].includes(routeName)) {
            expect(wrapper.text()).toContain('No selected AAS')
          } else {
            expect(wrapper.text()).toContain('No selected Submodel / Submodel Element')
          }
        })
      }
    })
  }
})

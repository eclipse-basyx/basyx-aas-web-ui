import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SubmodelElementSummary from '@/components/SubmodelElements/SubmodelElementSummary.vue'
import SubmodelElementGroup from '@/components/UIComponents/SubmodelElementGroup.vue'

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({ setData: vi.fn(async value => value) }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({ unitSuffix: vi.fn(() => '') }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({ nameToDisplay: vi.fn(value => value.idShort) }),
}))

const slotStub = { template: '<div><slot /></div>' }

describe('SubmodelElementGroup overview alignment', () => {
  it('marks every row with a trailing indicator for vertical centering', async () => {
    const wrapper = mount(SubmodelElementGroup, {
      props: {
        smeLocator: 'value',
        smeObject: {
          modelType: 'SubmodelElementCollection',
          path: '/collection',
          value: [
            { modelType: 'SubmodelElementCollection', idShort: 'nested', value: [] },
            { modelType: 'SubmodelElementList', idShort: 'list', value: [] },
            { modelType: 'Entity', idShort: 'entity', statements: [] },
            { modelType: 'Operation', idShort: 'operation' },
          ],
        },
      },
      global: {
        stubs: {
          'v-container': slotStub,
          'v-card': slotStub,
          'v-list': slotStub,
          'v-list-item': slotStub,
          'v-list-item-title': slotStub,
          'v-alert': {
            template: '<div v-bind="$attrs"><slot name="prepend" /><slot /><slot name="append" /></div>',
          },
          'v-badge': true,
          'v-chip': true,
          'v-divider': true,
          'v-icon': true,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findAll('.overview-alert')).toHaveLength(4)
  })

  it('uses the same overview row layout for a complex Operation variable', () => {
    const wrapper = mount(SubmodelElementSummary, {
      props: {
        element: {
          modelType: 'SubmodelElementCollection',
          idShort: 'CollectionVariable',
          value: [{ modelType: 'Property', idShort: 'TestProp' }],
        },
      },
      global: {
        stubs: {
          'v-alert': {
            props: ['text'],
            template: '<div v-bind="$attrs">{{ text }}<slot name="prepend" /><slot name="append" /></div>',
          },
          'v-badge': {
            props: ['content'],
            template: '<span data-testid="child-count">{{ content }}</span>',
          },
          'v-chip': slotStub,
          'v-icon': true,
        },
      },
    })

    expect(wrapper.classes()).toContain('overview-alert')
    expect(wrapper.text()).toContain('SubmodelElementCollection')
    expect(wrapper.text()).toContain('CollectionVariable')
    expect(wrapper.get('[data-testid="child-count"]').text()).toBe('1')
  })
})

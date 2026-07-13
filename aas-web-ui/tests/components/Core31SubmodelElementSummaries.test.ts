import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import GenericDataVisu from '@/components/UIComponents/GenericDataVisu.vue'
import SubmodelElementGroup from '@/components/UIComponents/SubmodelElementGroup.vue'

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({ setData: vi.fn(async (value: unknown) => value) }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({ unitSuffix: vi.fn(() => '') }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({ nameToDisplay: (value: any) => value.idShort || value.modelType }),
}))

const slotStub = { template: '<div><slot /></div>' }
const summaryStub = {
  props: ['element'],
  template: '<div data-test="summary">{{ element.modelType }}</div>',
}

describe('AAS Core 3.1 recursive summaries', () => {
  const children = [
    { modelType: 'BasicEventElement', idShort: 'event', direction: 'input', state: 'on' },
    { modelType: 'Capability', idShort: 'capability' },
  ]

  it('summarizes BasicEventElement and Capability in container detail views', async () => {
    const wrapper = mount(SubmodelElementGroup, {
      props: { smeObject: { value: children }, smeLocator: 'value' },
      global: {
        stubs: {
          'v-container': slotStub,
          'v-card': slotStub,
          'v-list': slotStub,
          'v-list-item': slotStub,
          'v-list-item-title': slotStub,
          'v-list-item-subtitle': slotStub,
          'v-divider': true,
          'v-alert': slotStub,
          'v-chip': slotStub,
          'v-badge': true,
          'v-text-field': true,
          'SubmodelElementSummary': summaryStub,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findAll('[data-test="summary"]')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Invalid SubmodelElement!')
  })

  it('summarizes BasicEventElement and Capability in generic recursive visualization', () => {
    const wrapper = mount(GenericDataVisu, {
      props: { submodelElementData: children },
      global: {
        stubs: {
          'v-container': slotStub,
          'v-expansion-panels': slotStub,
          'v-expansion-panel': slotStub,
          'v-expansion-panel-title': slotStub,
          'v-expansion-panel-text': slotStub,
          'v-list': slotStub,
          'DescriptionElement': true,
          'SubmodelElementSummary': summaryStub,
          'InvalidElement': { template: '<div>Invalid</div>' },
        },
      },
    })

    return flushPromises().then(() => {
      expect(wrapper.findAll('[data-test="summary"]')).toHaveLength(2)
      expect(wrapper.text()).not.toContain('Invalid')
    })
  })
})

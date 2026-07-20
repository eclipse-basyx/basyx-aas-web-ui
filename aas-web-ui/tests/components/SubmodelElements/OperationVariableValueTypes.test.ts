import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DateTimeStampType from '@/components/SubmodelElements/ValueTypes/DateTimeStampType.vue'
import DateType from '@/components/SubmodelElements/ValueTypes/DateType.vue'
import NumberType from '@/components/SubmodelElements/ValueTypes/NumberType.vue'
import StringType from '@/components/SubmodelElements/ValueTypes/StringType.vue'

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({ getSelectedNode: { path: '/operation' } }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({ patchRequest: vi.fn() }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({ fetchAndDispatchSme: vi.fn() }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({ unitSuffix: vi.fn(() => '') }),
}))

const stubs = {
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-text-field': { template: '<input />' },
  'v-chip': true,
  'v-divider': true,
  'v-btn': true,
  'v-icon': true,
  'v-row': true,
  'v-col': true,
  'v-date-picker': true,
}

describe('Operation variable value controls', () => {
  it.each([
    [NumberType, 'numberValue', { value: '42', valueType: 'xs:int' }],
    [StringType, 'stringValue', { value: 'unchanged', valueType: 'xs:string' }],
    [DateType, 'dateValue', { value: '2026-07-13', valueType: 'xs:date' }],
    [DateTimeStampType, 'dateTimeStampValue', { value: '2026-07-13T12:00:00Z', valueType: 'xs:dateTime' }],
  ])('does not submit an unchanged value on blur', async (component, valueProp, value) => {
    const wrapper = mount(component as any, {
      props: {
        [valueProp]: { modelType: 'Property', idShort: 'value', ...value },
        isOperationVariable: true,
      },
      global: { stubs },
    })

    await (wrapper.vm as any).setFocus(false)

    expect(wrapper.emitted('update-value')).toBeUndefined()
  })
})

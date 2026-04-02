import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BooleanType from '@/components/SubmodelElements/ValueTypes/BooleanType.vue'
import DateTimeStampType from '@/components/SubmodelElements/ValueTypes/DateTimeStampType.vue'
import DateType from '@/components/SubmodelElements/ValueTypes/DateType.vue'
import NumberType from '@/components/SubmodelElements/ValueTypes/NumberType.vue'
import StringType from '@/components/SubmodelElements/ValueTypes/StringType.vue'

const patchRequestMock = vi.fn()
const fetchAndDispatchSmeMock = vi.fn()

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    patchRequest: patchRequestMock,
  }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({
    fetchAndDispatchSme: fetchAndDispatchSmeMock,
  }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({
    unitSuffix: () => '',
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedNode: { path: 'https://example.test/submodels/sm/submodel-elements/selected' },
  }),
}))

type CaseConfig = {
  name: string
  component: any
  propName: string
  initialValue: any
  nextValue: any
}

const cases: CaseConfig[] = [
  {
    name: 'StringType',
    component: StringType,
    propName: 'stringValue',
    initialValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-a',
      modelType: 'Property',
      idShort: 'PropertyA',
      value: 'A',
    },
    nextValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-b',
      modelType: 'Property',
      idShort: 'PropertyB',
      value: 'B',
    },
  },
  {
    name: 'NumberType',
    component: NumberType,
    propName: 'numberValue',
    initialValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-a',
      modelType: 'Property',
      idShort: 'PropertyA',
      value: '1',
    },
    nextValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-b',
      modelType: 'Property',
      idShort: 'PropertyB',
      value: '2',
    },
  },
  {
    name: 'BooleanType',
    component: BooleanType,
    propName: 'booleanValue',
    initialValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-a',
      modelType: 'Property',
      idShort: 'PropertyA',
      value: 'true',
    },
    nextValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-b',
      modelType: 'Property',
      idShort: 'PropertyB',
      value: 'false',
    },
  },
  {
    name: 'DateType',
    component: DateType,
    propName: 'dateValue',
    initialValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-a',
      modelType: 'Property',
      idShort: 'PropertyA',
      value: '2026-01-01',
    },
    nextValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-b',
      modelType: 'Property',
      idShort: 'PropertyB',
      value: '2026-01-02',
    },
  },
  {
    name: 'DateTimeStampType',
    component: DateTimeStampType,
    propName: 'dateTimeStampValue',
    initialValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-a',
      modelType: 'Property',
      idShort: 'PropertyA',
      value: '2026-01-01T10:00:00Z',
    },
    nextValue: {
      path: 'https://example.test/submodels/sm/submodel-elements/property-b',
      modelType: 'Property',
      idShort: 'PropertyB',
      value: '2026-01-02T11:00:00Z',
    },
  },
]

describe('ValueTypes write path regression', () => {
  beforeEach(() => {
    patchRequestMock.mockReset()
    fetchAndDispatchSmeMock.mockReset()
    patchRequestMock.mockResolvedValue({ success: true })
  })

  it.each(cases)('$name uses the latest prop path for update', async ({ component, propName, initialValue, nextValue }) => {
    const wrapper = mount(component, {
      props: {
        isEditable: true,
        [propName]: initialValue,
      },
      global: {
        stubs: {
          'v-list-item': true,
          'v-list-item-title': true,
          'v-text-field': true,
          'v-btn': true,
          'v-icon': true,
          'v-switch': true,
          'v-row': true,
          'v-col': true,
          'v-date-picker': true,
        },
      },
    })

    await wrapper.setProps({
      [propName]: nextValue,
    })

    await (wrapper.vm as any).updateValue()

    expect(patchRequestMock).toHaveBeenCalledTimes(1)
    expect(patchRequestMock.mock.calls[0][0]).toBe(`${nextValue.path}/$value`)
  })
})

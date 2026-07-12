import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DataSpecificationContent from '@/components/UIComponents/DataSpecificationContent.vue'

const slotStub = {
  template: '<div><slot /></div>',
}

const tableStub = {
  template: '<table><slot /></table>',
}

const vuetifyStubs = {
  'v-chip': slotStub,
  'v-col': slotStub,
  'v-container': slotStub,
  'v-icon': slotStub,
  'v-row': slotStub,
  'v-sheet': slotStub,
  'v-spacer': true,
  'v-table': tableStub,
}

function mountDataSpecificationContent (dataSpecificationObject: Record<string, unknown>) {
  return mount(DataSpecificationContent, {
    props: {
      dataSpecificationObject,
    },
    global: {
      stubs: vuetifyStubs,
    },
  })
}

describe('DataSpecificationContent.vue', () => {
  it('renders the complete IEC 61360 content shape', () => {
    const wrapper = mountDataSpecificationContent({
      modelType: 'DataSpecificationIec61360',
      preferredName: [{ language: 'en', text: 'Temperature' }],
      shortName: [{ language: 'en', text: 'Temp' }],
      unit: 'degree Celsius',
      unitId: {
        keys: [
          {
            type: aasTypes.KeyTypes.GlobalReference,
            value: '0173-1#05-AAA650#002',
          },
        ],
      },
      sourceOfDefinition: 'IEC 61360-1',
      symbol: 'degC',
      dataType: aasTypes.DataTypeIec61360.RealMeasure,
      definition: [{ language: 'en', text: 'Measured temperature value.' }],
      valueFormat: 'NR1..5',
      valueList: {
        valueReferencePairs: [
          {
            value: 'warm',
            valueId: {
              keys: [
                {
                  type: aasTypes.KeyTypes.GlobalReference,
                  value: '0173-1#07-BAA123#001',
                },
              ],
            },
          },
        ],
      },
      value: '21',
      levelType: {
        min: true,
        nom: false,
        typ: true,
        max: true,
      },
    })

    const renderedText = wrapper.text()

    expect(renderedText).toContain('Data Specification Content')
    expect(renderedText).toContain('DataSpecificationIec61360')
    expect(renderedText).toContain('Preferred Name')
    expect(renderedText).toContain('Temperature')
    expect(renderedText).toContain('Short Name')
    expect(renderedText).toContain('Temp')
    expect(renderedText).toContain('RealMeasure')
    expect(renderedText).toContain('degree Celsius')
    expect(renderedText).toContain('Unit ID')
    expect(renderedText).toContain('GlobalReference')
    expect(renderedText).toContain('0173-1#05-AAA650#002')
    expect(renderedText).toContain('Source of Definition')
    expect(renderedText).toContain('IEC 61360-1')
    expect(renderedText).toContain('Symbol')
    expect(renderedText).toContain('degC')
    expect(renderedText).toContain('Definition')
    expect(renderedText).toContain('Measured temperature value.')
    expect(renderedText).toContain('Value Format')
    expect(renderedText).toContain('NR1..5')
    expect(renderedText).toContain('Value List')
    expect(renderedText).toContain('warm')
    expect(renderedText).toContain('0173-1#07-BAA123#001')
    expect(renderedText).toContain('Value')
    expect(renderedText).toContain('21')
    expect(renderedText).toContain('Level Type')
    expect(renderedText).toContain('MIN')
    expect(renderedText).toContain('TYP')
    expect(renderedText).toContain('MAX')
  })

  it('renders numeric enum value 0 and skips empty optional sections', () => {
    const wrapper = mountDataSpecificationContent({
      preferredName: [{ language: 'en', text: 'Calendar date' }],
      dataType: aasTypes.DataTypeIec61360.Date,
      unitId: null,
      valueList: {
        valueReferencePairs: [],
      },
      levelType: {
        min: false,
        nom: false,
        typ: false,
        max: false,
      },
    })

    const renderedText = wrapper.text()

    expect(renderedText).toContain('Date')
    expect(renderedText).not.toContain('Unit ID')
    expect(renderedText).not.toContain('Value List')
    expect(renderedText).not.toContain('Level Type')
  })

  it('does not render an empty content object', () => {
    const wrapper = mountDataSpecificationContent({})

    expect(wrapper.text()).toBe('')
  })
})

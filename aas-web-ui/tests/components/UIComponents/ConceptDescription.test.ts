import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConceptDescription from '@/components/UIComponents/ConceptDescription.vue'
import DataSpecificationContent from '@/components/UIComponents/DataSpecificationContent.vue'

const slotStub = {
  template: '<div><slot /></div>',
}

const listItemStub = {
  template: `
    <div>
      <slot name="prepend" />
      <slot />
      <slot name="title" />
      <slot name="subtitle" />
      <slot name="append" />
    </div>
  `,
}

const vuetifyStubs = {
  'v-card': slotStub,
  'v-chip': slotStub,
  'v-col': slotStub,
  'v-container': slotStub,
  'v-divider': true,
  'v-icon': slotStub,
  'v-list': slotStub,
  'v-list-item': listItemStub,
  'v-list-item-subtitle': slotStub,
  'v-list-item-title': slotStub,
  'v-row': slotStub,
  'v-sheet': slotStub,
  'v-spacer': true,
  'v-table': {
    template: '<table><slot /></table>',
  },
  'v-tooltip': slotStub,
}

describe('ConceptDescription.vue', () => {
  it('renders embedded data specification content inside the concept description', () => {
    const wrapper = mount(ConceptDescription, {
      props: {
        conceptDescriptionObject: {
          id: 'concept-description-1',
          idShort: 'TemperatureConcept',
          modelType: 'ConceptDescription',
          displayName: [{ language: 'en', text: 'Temperature display name' }],
          description: [{ language: 'en', text: 'Temperature concept description.' }],
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                keys: [
                  {
                    type: 'GlobalReference',
                    value: 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                  },
                ],
              },
              dataSpecificationContent: {
                modelType: 'DataSpecificationIec61360',
                preferredName: [{ language: 'en', text: 'Temperature' }],
                sourceOfDefinition: 'IEC 61360-1',
                valueFormat: 'NR1..5',
                valueList: {
                  valueReferencePairs: [
                    {
                      value: 'warm',
                    },
                  ],
                },
                levelType: {
                  min: true,
                  nom: false,
                  typ: false,
                  max: true,
                },
              },
            },
          ],
          timestamp: '2026-06-11T10:00:00.000Z',
        },
      },
      global: {
        components: {
          DataSpecificationContent,
        },
        stubs: {
          ...vuetifyStubs,
          DisplayNameElement: true,
          DescriptionElement: true,
          IdentificationElement: true,
          LastSync: true,
        },
      },
    })

    const renderedText = wrapper.text()

    expect(renderedText).toContain('Temperature display name')
    expect(renderedText).toContain('ConceptDescription')
    expect(renderedText).toContain('Identification (ID)')
    expect(renderedText).toContain('concept-description-1')
    expect(renderedText).toContain('ID short')
    expect(renderedText).toContain('TemperatureConcept')
    expect(renderedText).toContain('Display Name')
    expect(renderedText).toContain('Temperature concept description.')
    expect(renderedText).toContain('Embedded Data Specifications')
    expect(renderedText).toContain('Embedded Data Specification 1')
    expect(renderedText).toContain('Data Specification')
    expect(renderedText).toContain('https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0')
    expect(renderedText).toContain('Data Specification Content')
    expect(renderedText).toContain('Temperature')
    expect(renderedText).toContain('Source of Definition')
    expect(renderedText).toContain('IEC 61360-1')
    expect(renderedText).toContain('Value Format')
    expect(renderedText).toContain('NR1..5')
    expect(renderedText).toContain('Value List')
    expect(renderedText).toContain('warm')
    expect(renderedText).toContain('Level Type')
    expect(renderedText).toContain('MIN')
    expect(renderedText).toContain('MAX')
  })

  it('hides the duplicate concept description header in small mode', () => {
    const wrapper = mount(ConceptDescription, {
      props: {
        small: true,
        conceptDescriptionObject: {
          id: 'concept-description-compact',
          idShort: 'CompactConcept',
          modelType: 'ConceptDescription',
          timestamp: '2026-06-11T10:00:00.000Z',
        },
      },
      global: {
        stubs: {
          ...vuetifyStubs,
          LastSync: true,
        },
      },
    })

    const renderedText = wrapper.text()

    expect(renderedText).toContain('Identification (ID)')
    expect(renderedText).toContain('concept-description-compact')
    expect(renderedText).toContain('ID short')
    expect(renderedText).toContain('CompactConcept')
    expect(renderedText).not.toContain('ConceptDescription')
  })
})

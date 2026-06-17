import { describe, expect, it } from 'vitest'
import { buildPlantUmlForSubmodelElement } from '@/utils/AAS/PlantUMLBuilder'

describe('PlantUMLBuilder', () => {
  it('includes empty-state warnings in the generated PlantUML source', () => {
    const result = buildPlantUmlForSubmodelElement({})

    expect(result.warnings).toEqual(['No Submodel/SubmodelElement data available for UML export.'])
    expect(result.source).toContain('\' Warning: No Submodel/SubmodelElement data available for UML export.')
  })

  it('builds a class diagram for a selected Submodel subtree', () => {
    const result = buildPlantUmlForSubmodelElement({
      modelType: 'Submodel',
      idShort: 'TechnicalData',
      id: 'https://example.test/submodels/technical-data',
      kind: 'Template',
      semanticId: {
        keys: [
          {
            type: 'GlobalReference',
            value: 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2',
          },
        ],
      },
      submodelElements: [
        {
          modelType: 'SubmodelElementCollection',
          idShort: 'GeneralInformation',
          qualifiers: [{ kind: 'ConceptQualifier', type: 'SMT/Cardinality', value: 'ZeroToMany' }],
          value: [
            {
              modelType: 'Property',
              idShort: 'ManufacturerName',
              valueType: 'xs:string',
              value: 'BaSyx',
              qualifiers: [{ kind: 'ConceptQualifier', type: 'Multiplicity', value: 'One' }],
            },
          ],
        },
      ],
    })

    expect(result.truncated).toBe(false)
    expect(result.source).toContain('class "TechnicalData" as C0 <<SM>>')
    expect(result.source).not.toContain('kind: Template')
    expect(result.source).not.toContain('semanticId:')
    expect(result.source).not.toContain('modelType:')
    expect(result.source).toContain('+ GeneralInformation: SMC')
    expect(result.source).toContain('class "GeneralInformation" as C1 <<SMC>>')
    expect(result.source).toContain('+ ManufacturerName: xs:string = BaSyx')
    expect(result.source).toContain('C0 *-- "0..*" C1')
    expect(result.source).not.toContain('C0 *-- "0..*" C1 : GeneralInformation')
  })

  it('builds CarbonFootprint-style headers and child model type members', () => {
    const result = buildPlantUmlForSubmodelElement({
      modelType: 'Submodel',
      idShort: 'CarbonFootprint',
      submodelElements: [
        {
          modelType: 'SubmodelElementList',
          idShort: 'ProductCarbonFootprints',
          qualifiers: [{ kind: 'ConceptQualifier', type: 'SMT/Cardinality', value: 'One' }],
          typeValueListElement: 'SubmodelElementCollection',
          value: [
            {
              modelType: 'SubmodelElementCollection',
              idShort: 'IgnoredListItemIdShort',
              value: [
                {
                  modelType: 'Property',
                  idShort: 'PcfCO2eq',
                  valueType: 'xs:decimal',
                  value: '6.93',
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.source).toContain('class "CarbonFootprint" as C0 <<SM>>')
    expect(result.source).toContain('+ ProductCarbonFootprints: SML')
    expect(result.source).toContain('class "ProductCarbonFootprints" as C1 <<SML>>')
    expect(result.source).toContain('+ {00}: SMC')
    expect(result.source).toContain('class "{00}" as C2 <<SMC>>')
    expect(result.source).not.toContain('IgnoredListItemIdShort')
    expect(result.source).toContain('+ PcfCO2eq: xs:decimal = 6.93')
    expect(result.source).toContain('C0 *-- "1" C1')
    expect(result.source).toContain('C1 *-- C2')
    expect(result.source).not.toContain('C0 *-- "1" C1 : ProductCarbonFootprints')
  })

  it('renders a selected leaf element as a single UML class', () => {
    const result = buildPlantUmlForSubmodelElement({
      modelType: 'Property',
      idShort: 'Odd "Name" {with braces}\nand line',
      valueType: 'xs:string',
      value: 'hello {world}\n@enduml',
    })

    expect(result.source).toContain('class "Odd \'Name\' (with braces) and line" as C0 <<Prop>>')
    expect(result.source).toContain('+ Odd \'Name\' (with braces) and line: xs:string = hello (world) enduml')
    expect(result.source).not.toContain('valueType:')
    expect(result.source.match(/@enduml/g)).toHaveLength(1)
  })

  it('supports Entity statements and AnnotatedRelationshipElement annotations', () => {
    const result = buildPlantUmlForSubmodelElement({
      modelType: 'Entity',
      idShort: 'AssetEntity',
      statements: [
        {
          modelType: 'AnnotatedRelationshipElement',
          idShort: 'Documents',
          first: {
            keys: [{ type: 'GlobalReference', value: 'https://example.test/assets/asset-1' }],
          },
          second: {
            keys: [{ type: 'GlobalReference', value: 'https://example.test/documents/doc-1' }],
          },
          annotations: [
            {
              modelType: 'Property',
              idShort: 'Role',
              valueType: 'xs:string',
              value: 'datasheet',
            },
          ],
        },
      ],
    })

    expect(result.source).toContain('class "AssetEntity" as C0 <<Entity>>')
    expect(result.source).toContain('+ Documents: ARel')
    expect(result.source).toContain('class "Documents" as C1 <<ARel>>')
    expect(result.source).not.toContain('relation:')
    expect(result.source).toContain('+ Role: xs:string = datasheet')
    expect(result.source).toContain('C0 *-- C1')
    expect(result.source).not.toContain('C0 *-- C1 : Documents')
  })

  it('only maps cardinality from ConceptQualifier entries', () => {
    const result = buildPlantUmlForSubmodelElement({
      modelType: 'Submodel',
      idShort: 'CardinalityRules',
      submodelElements: [
        {
          modelType: 'SubmodelElementCollection',
          idShort: 'TemplateOnly',
          qualifiers: [{ kind: 'TemplateQualifier', type: 'SMT/Cardinality', value: 'OneToMany' }],
          value: [],
        },
        {
          modelType: 'SubmodelElementCollection',
          idShort: 'ConceptQualified',
          qualifiers: [{ kind: 'ConceptQualifier', type: 'SMT/Cardinality', value: 'ZeroToOne' }],
          value: [],
        },
      ],
    })

    expect(result.source).toContain('C0 *-- C1')
    expect(result.source).not.toContain('C0 *-- "1..*" C1 : TemplateOnly')
    expect(result.source).not.toContain('C0 *-- C1 : TemplateOnly')
    expect(result.source).toContain('C0 *-- "0..1" C2')
    expect(result.source).not.toContain('C0 *-- "0..1" C2 : ConceptQualified')
  })

  it('forces MultiLanguageProperty members into the field compartment without a value', () => {
    const result = buildPlantUmlForSubmodelElement({
      modelType: 'SubmodelElementCollection',
      idShort: 'Contact',
      value: [
        {
          modelType: 'MultiLanguageProperty',
          idShort: 'Department',
        },
      ],
    })

    expect(result.source).toContain('class "Contact" as C0 <<SMC>>')
    expect(result.source).toContain('{field} + Department: MLP')
    expect(result.source).not.toContain('{field} + Department: MLP =')
  })

  it('uses model type shorthands for data elements without a value type', () => {
    const result = buildPlantUmlForSubmodelElement({
      modelType: 'Submodel',
      idShort: 'SecondSubmodel',
      submodelElements: [
        {
          modelType: 'ReferenceElement',
          idShort: 'PropReference',
          value: {
            keys: [
              { type: 'Submodel', value: 'https://htw-berlin.de/ids/sm/demosubmodelv3' },
              { type: 'Property', value: 'DemoProperty' },
            ],
          },
        },
        {
          modelType: 'RelationshipElement',
          idShort: 'Relationship',
        },
      ],
    })

    expect(result.source).toContain('{field} + PropReference: Ref = https://htw-berlin.de/ids/sm/demosubmodelv3 /...')
    expect(result.source).toContain('{field} + Relationship: Rel')
    expect(result.source).not.toContain('PropReference: ReferenceElement')
    expect(result.source).not.toContain('Relationship: RelationshipElement')
  })

  it('bounds long member text to keep class boxes readable', () => {
    const result = buildPlantUmlForSubmodelElement(
      {
        modelType: 'Submodel',
        idShort: 'LongText',
        submodelElements: [
          {
            modelType: 'Property',
            idShort: 'VeryLongPropertyName',
            valueType: 'xs:string',
            value: 'VeryLongPropertyValue',
          },
        ],
      },
      { maxTextLength: 12 },
    )

    expect(result.source).toContain('+ VeryLongP...: xs:string = VeryLongP...')
    expect(result.source).not.toContain('VeryLongPropertyName')
    expect(result.source).not.toContain('VeryLongPropertyValue')
  })

  it('truncates large diagrams deterministically', () => {
    const result = buildPlantUmlForSubmodelElement(
      {
        modelType: 'Submodel',
        idShort: 'LargeSubmodel',
        submodelElements: [
          { modelType: 'Property', idShort: 'A', value: 'a' },
          { modelType: 'Property', idShort: 'B', value: 'b' },
          { modelType: 'Property', idShort: 'C', value: 'c' },
        ],
      },
      { maxElements: 2 },
    )

    expect(result.truncated).toBe(true)
    expect(result.nodeCount).toBe(2)
    expect(result.warnings).toEqual(['UML diagram was truncated after 2 elements.'])
    expect(result.source).toContain('\' Warning: UML diagram was truncated after 2 elements.')
    expect(result.source).toContain('+ A: Prop = a')
    expect(result.source).not.toContain('+ B: Prop = b')
  })
})

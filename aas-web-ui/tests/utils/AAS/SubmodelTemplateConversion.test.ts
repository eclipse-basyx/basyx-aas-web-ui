import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
import { describe, expect, it } from 'vitest'
import { convertSubmodelTemplateToInstance } from '@/utils/AAS/SubmodelTemplateConversion'

function qualifier (kind: aasTypes.QualifierKind | null, type: string): aasTypes.Qualifier {
  return new aasTypes.Qualifier(type, aasTypes.DataTypeDefXsd.String, null, null, kind)
}

function property (
  idShort: string,
  qualifiers: Array<aasTypes.Qualifier> | null = null,
): aasTypes.Property {
  const result = new aasTypes.Property(aasTypes.DataTypeDefXsd.String)
  result.idShort = idShort
  result.qualifiers = qualifiers
  return result
}

describe('convertSubmodelTemplateToInstance', () => {
  it('converts the complete submodel and removes only template qualifiers', () => {
    const collectionProperty = property('CollectionProperty', [
      qualifier(aasTypes.QualifierKind.TemplateQualifier, 'collection-template'),
    ])
    const collection = new aasTypes.SubmodelElementCollection()
    collection.idShort = 'Collection'
    collection.qualifiers = [qualifier(aasTypes.QualifierKind.TemplateQualifier, 'template-only')]
    collection.value = [collectionProperty]

    const listProperty = property('ListProperty', [
      qualifier(aasTypes.QualifierKind.TemplateQualifier, 'list-template'),
      qualifier(aasTypes.QualifierKind.ValueQualifier, 'list-value'),
    ])
    const list = new aasTypes.SubmodelElementList(aasTypes.AasSubmodelElements.Property)
    list.idShort = 'List'
    list.qualifiers = [qualifier(aasTypes.QualifierKind.ValueQualifier, 'value')]
    list.valueTypeListElement = aasTypes.DataTypeDefXsd.String
    list.value = [listProperty]

    const annotation = property('Annotation', [
      qualifier(aasTypes.QualifierKind.TemplateQualifier, 'annotation-template'),
    ])
    const relationship = new aasTypes.AnnotatedRelationshipElement()
    relationship.idShort = 'Relationship'
    relationship.qualifiers = [qualifier(aasTypes.QualifierKind.TemplateQualifier, 'relationship-template')]
    relationship.annotations = [annotation]

    const entity = new aasTypes.Entity()
    entity.idShort = 'Entity'
    entity.qualifiers = [qualifier(null, 'default-concept')]
    entity.statements = [relationship]

    const nestedOperationInput = property('NestedInput', [
      qualifier(aasTypes.QualifierKind.TemplateQualifier, 'nested-input-template'),
    ])
    const nestedOperation = new aasTypes.Operation()
    nestedOperation.idShort = 'NestedOperation'
    nestedOperation.qualifiers = [qualifier(aasTypes.QualifierKind.TemplateQualifier, 'nested-operation-template')]
    nestedOperation.inputVariables = [new aasTypes.OperationVariable(nestedOperationInput)]

    const operationInput = property('Input', [
      qualifier(aasTypes.QualifierKind.ConceptQualifier, 'input-concept'),
      qualifier(aasTypes.QualifierKind.TemplateQualifier, 'input-template'),
    ])
    const operation = new aasTypes.Operation()
    operation.idShort = 'Operation'
    operation.qualifiers = [qualifier(aasTypes.QualifierKind.TemplateQualifier, 'operation-template')]
    operation.inputVariables = [new aasTypes.OperationVariable(operationInput)]
    operation.outputVariables = [new aasTypes.OperationVariable(nestedOperation)]

    const submodel = new aasTypes.Submodel('urn:example:template')
    submodel.idShort = 'Template'
    submodel.kind = aasTypes.ModellingKind.Template
    submodel.qualifiers = [
      qualifier(aasTypes.QualifierKind.TemplateQualifier, 'root-template'),
      qualifier(aasTypes.QualifierKind.ConceptQualifier, 'root-concept'),
    ]
    submodel.submodelElements = [collection, list, entity, operation]

    const removedQualifierCount = convertSubmodelTemplateToInstance(submodel)

    expect(removedQualifierCount).toBe(10)
    expect(submodel.kind).toBe(aasTypes.ModellingKind.Instance)
    expect(submodel.id).toBe('urn:example:template')
    expect(submodel.idShort).toBe('Template')
    expect(submodel.qualifiers?.map(entry => entry.type)).toEqual(['root-concept'])
    expect(collection.qualifiers).toBeNull()
    expect(collectionProperty.qualifiers).toBeNull()
    expect(list.qualifiers?.map(entry => entry.type)).toEqual(['value'])
    expect(listProperty.qualifiers?.map(entry => entry.type)).toEqual(['list-value'])
    expect(entity.qualifiers?.map(entry => entry.type)).toEqual(['default-concept'])
    expect(relationship.qualifiers).toBeNull()
    expect(annotation.qualifiers).toBeNull()
    expect(operation.qualifiers).toBeNull()
    expect(operationInput.qualifiers?.map(entry => entry.type)).toEqual(['input-concept'])
    expect(nestedOperation.qualifiers).toBeNull()
    expect(nestedOperationInput.qualifiers).toBeNull()
  })

  it('sets an empty root qualifier collection to null', () => {
    const submodel = new aasTypes.Submodel('urn:example:template')
    submodel.kind = aasTypes.ModellingKind.Template
    submodel.qualifiers = [qualifier(aasTypes.QualifierKind.TemplateQualifier, 'template')]

    expect(convertSubmodelTemplateToInstance(submodel)).toBe(1)
    expect(submodel.qualifiers).toBeNull()
  })
})

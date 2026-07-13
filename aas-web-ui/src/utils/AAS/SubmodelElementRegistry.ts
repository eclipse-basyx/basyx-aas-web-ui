import { getDataElementModelTypes } from '@/utils/AAS/SubmodelElementPathUtils'

export const concreteSubmodelElementTypes = [
  'Property',
  'MultiLanguageProperty',
  'Range',
  'File',
  'Blob',
  'ReferenceElement',
  'RelationshipElement',
  'AnnotatedRelationshipElement',
  'SubmodelElementCollection',
  'SubmodelElementList',
  'Entity',
  'Operation',
  'BasicEventElement',
  'Capability',
] as const

export type ConcreteSubmodelElementType = (typeof concreteSubmodelElementTypes)[number]

export interface SubmodelElementTypeMetadata {
  type: ConcreteSubmodelElementType
  label: string
  icon: string
  dataElement: boolean
  canContainChildren: boolean
}

const dataElementTypes = new Set<string>(getDataElementModelTypes())

export const submodelElementTypeRegistry: ReadonlyMap<ConcreteSubmodelElementType, SubmodelElementTypeMetadata>
  = new Map(concreteSubmodelElementTypes.map(type => [type, {
    type,
    label: splitPascalCase(type),
    icon: iconFor(type),
    dataElement: dataElementTypes.has(type),
    canContainChildren: [
      'AnnotatedRelationshipElement',
      'SubmodelElementCollection',
      'SubmodelElementList',
      'Entity',
      'Operation',
    ].includes(type),
  }]))

export function allowedChildTypes (parent: any): ConcreteSubmodelElementType[] {
  if (parent?.modelType === 'AnnotatedRelationshipElement') {
    return concreteSubmodelElementTypes.filter(type => dataElementTypes.has(type))
  }
  if (parent?.modelType === 'SubmodelElementList' && parent.typeValueListElement) {
    const requiredType = String(parent.typeValueListElement)
    if (requiredType === 'SubmodelElement') {
      return [...concreteSubmodelElementTypes]
    }
    if (requiredType === 'DataElement') {
      return concreteSubmodelElementTypes.filter(type => dataElementTypes.has(type))
    }
    if (requiredType === 'EventElement') {
      return ['BasicEventElement']
    }
    return concreteSubmodelElementTypes.filter(type => type === requiredType)
  }
  return [...concreteSubmodelElementTypes]
}

export function isChildTypeAllowed (parent: any, childType: string): boolean {
  return allowedChildTypes(parent).includes(childType as ConcreteSubmodelElementType)
}

function splitPascalCase (value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function iconFor (type: ConcreteSubmodelElementType): string {
  if (type === 'Operation') {
    return 'mdi-lightning-bolt-circle'
  }
  if (type === 'BasicEventElement') {
    return 'mdi-broadcast'
  }
  if (type === 'Capability') {
    return 'mdi-star-circle-outline'
  }
  if (type === 'SubmodelElementList') {
    return 'mdi-list-box'
  }
  if (type === 'SubmodelElementCollection') {
    return 'mdi-file-multiple'
  }
  if (type === 'Entity') {
    return 'mdi-format-list-group'
  }
  return 'mdi-file-code-outline'
}

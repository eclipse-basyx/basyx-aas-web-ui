// describes the template/ model structure from the AAS template json files
export type LangString = {
  language: string
  text: string
}
export type ReferenceKey = {
  type: string
  value: string
}

export type Reference = {
  type: string
  keys: ReferenceKey[]
}
export type ModelType
  = | 'Property'
    | 'MultiLanguageProperty'
    | 'File'
    | 'SubmodelElementCollection'
    | 'SubmodelElementList'
    | 'ReferenceElement'
    | 'Range'

export type BaseTemplateElement = {
  [key: string]: unknown
  idShort: string
  modelType: ModelType
  valueType?: string
  displayName?: LangString[]
  description?: LangString[]
  semanticId?: Reference
  supplementalSemanticIds?: Reference[]
  qualifiers?: Record<string, unknown>[]
  _cardinality?: CardinalityInfo
}

export type PropertyElement = BaseTemplateElement & {
  modelType: 'Property'
  value?: string
}

export type MultiLanguagePropertyElement = BaseTemplateElement & {
  modelType: 'MultiLanguageProperty'
  value?: LangString[]
}

export type FileElement = BaseTemplateElement & {
  modelType: 'File'
  contentType?: string
  value?: string
}

// type support for Technical data
type ReferenceElement = BaseTemplateElement & {
  modelType: 'ReferenceElement'
  value?: Reference
}
// type support for Technical data
type RangeElement = BaseTemplateElement & {
  modelType: 'Range'
  valueType?: string
  min?: string
  max?: string
}

export type TemplateElement
  = | PropertyElement
    | MultiLanguagePropertyElement
    | FileElement
    | SubmodelElementCollectionElement
    | SubmodelElementListElement
    | ReferenceElement
    | RangeElement

export type SubmodelElementCollectionElement = BaseTemplateElement & {
  modelType: 'SubmodelElementCollection'
  value: TemplateElement[]
}

export type SubmodelElementListElement = BaseTemplateElement & {
  modelType: 'SubmodelElementList'
  value: TemplateElement[]
}

export type SubmodelTemplate = {
  [key: string]: unknown
  modelType?: string
  kind?: string
  semanticId?: Reference
  administration?: Record<string, unknown>
  id?: string
  description?: LangString[]
  displayName?: LangString[]
  idShort: string
  submodelElements: TemplateElement[]
}

export type CardinalityKind = 'One' | 'ZeroToOne' | 'ZeroToMany' | 'OneToMany' | 'Unknown'

export type CardinalityInfo = {
  raw: CardinalityKind
  required: boolean
  repeatable: boolean
  minOccurs: number
  maxOccurs: number | null
}

export type DigitalNameplateTemplate = SubmodelTemplate
export type TechnicalDataTemplate = SubmodelTemplate
export type HandoverDocumentationTemplate = SubmodelTemplate

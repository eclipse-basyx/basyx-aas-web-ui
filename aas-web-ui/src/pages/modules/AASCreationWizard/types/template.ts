// export type TemplateElement_1 = {
//     idShort: string;
//     modelType: string;
//     valueType?: string;
//     value?: string;
// };

// export type DigitalNameplateTemplate_1 = {
//     idShort: string;
//     submodelElements: TemplateElement[];
// };
export type LangString = {
  language: string
  text: string
}
export type ReferenceKey = {
  type: string
  value: string
}

export type Reference = {
  type?: string
  keys?: ReferenceKey[]
}
export type ModelType
  = | 'Property'
    | 'MultiLanguageProperty'
    | 'File'
    | 'SubmodelElementCollection'
    | 'SubmodelElementList'

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

export type TemplateElement
  = | PropertyElement
    | MultiLanguagePropertyElement
    | FileElement
    | SubmodelElementCollectionElement
    | SubmodelElementListElement

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

export type DigitalNameplateTemplate = SubmodelTemplate

export interface LangString {
  language?: string
  text?: string
}

/** A Submodel or SubmodelElement as returned by `setData`, i.e. including its `path` */
export interface SubmodelElementLike {
  [key: string]: any
  idShort?: string
  path?: string
  modelType?: string
  contentType?: string
  value?: any
}

/** A key of a Reference, e.g. of a semanticId */
export interface Key {
  type?: string
  value?: string
}

/** A Reference, e.g. a semanticId or valueId */
export interface ReferenceLike {
  keys?: Key[]
}

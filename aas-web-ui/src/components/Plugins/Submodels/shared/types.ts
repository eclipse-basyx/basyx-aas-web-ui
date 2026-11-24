export type LangString = {
  language?: string
  text?: string
}

/** A Submodel or SubmodelElement as returned by `setData`, i.e. including its `path` */
export type SubmodelElementLike = {
  [key: string]: any
  idShort?: string
  path?: string
  modelType?: string
  contentType?: string
  value?: any
}

/** A key of a Reference, e.g. of a semanticId */
export type Key = {
  type?: string
  value?: string
}

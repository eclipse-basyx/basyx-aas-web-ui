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

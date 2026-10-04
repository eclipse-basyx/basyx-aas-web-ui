export type LangString = {
  language?: string
  text?: string
}

/** A (File) SubmodelElement as returned by `setData`, i.e. including its `path` */
export type SubmodelElementLike = {
  [key: string]: any
  idShort?: string
  path?: string
  modelType?: string
  contentType?: string
  value?: any
}

export type Model3DApplication = {
  name: string
  version: string
  qualifier: string
  vendor: string
}

export type Model3DExternalFile = {
  url: string
  identifier: string
  host: string
}

export type Model3DVersion = {
  key: string
  title: LangString[]
  fileName: string
  versionId: string
  status: string
  setDate: string
  format: { name: string, version: string, qualifier: string }
  previewFile: SubmodelElementLike | null
  digitalFile: SubmodelElementLike | null
  externalFiles: Model3DExternalFile[]
  sourceApplication: Model3DApplication | null
  providingOrganization: string
}

export type Model3DClassification = {
  id: string
  name: LangString[]
  system: string
}

export type Model3DBoundingBox = {
  kind: string
  x: string
  y: string
  z: string
}

export type Model3DEntry = {
  key: string
  isPrimary: boolean
  valueIds: string[]
  versions: Model3DVersion[]
  consumingApplications: Model3DApplication[]
  classifications: Model3DClassification[]
  positivePurposes: string[]
  negativePurposes: string[]
  embeddedInfo: string[]
  states: string[]
  objectType: string
  origin: string
  /** `Capability/Simplification`, null if the model is not marked as simplified */
  simplification: { description: string, reducedElements: string[] } | null
  representation: string
  lengthUnit: string
  boundingBoxes: Model3DBoundingBox[]
}

export type DetailRow = {
  label: string
  value: string
  icon?: string
}

export type DetailGroup = {
  key: string
  title: string
  icon: string
  rows: DetailRow[]
}

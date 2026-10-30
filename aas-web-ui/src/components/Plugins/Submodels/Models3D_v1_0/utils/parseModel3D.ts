import type {
  LangString,
  Model3DApplication,
  Model3DBoundingBox,
  Model3DClassification,
  Model3DEntry,
  Model3DExternalFile,
  Model3DVersion,
  SubmodelElementLike,
} from '../types'

/**
 * Looks up a child by idShort. Instances created from the IDTA template may carry a numeric suffix
 * (e.g. `IsPrimary01`), so a trailing number is tolerated. As a fallback the last segment of the semanticId
 * (`…/<idShort>/<version>/<revision>`) is compared.
 */
function matches (element: SubmodelElementLike, idShort: string): boolean {
  if (new RegExp(String.raw`^${idShort}\d*$`, 'i').test(element?.idShort ?? '')) {
    return true
  }

  const semanticIdKeys: Array<{ value?: string }> = element?.semanticId?.keys ?? []
  return semanticIdKeys.some(key => new RegExp(String.raw`/${idShort}/\d+/\d+/?$`, 'i').test(key.value ?? ''))
}

/** Child elements of a Submodel (`submodelElements`), a collection or a list (`value`) */
function children (parent: SubmodelElementLike | undefined | null): SubmodelElementLike[] {
  if (Array.isArray(parent?.submodelElements)) {
    return parent.submodelElements
  }
  return Array.isArray(parent?.value) ? parent.value : []
}

function child (parent: SubmodelElementLike | undefined | null, idShort: string): SubmodelElementLike | undefined {
  return children(parent).find(element => matches(element, idShort))
}

function text (parent: SubmodelElementLike | undefined | null, idShort: string): string {
  const value = child(parent, idShort)?.value
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : ''
}

function langStrings (parent: SubmodelElementLike | undefined | null, idShort: string): LangString[] {
  const value = child(parent, idShort)?.value
  return Array.isArray(value) ? value : []
}

/** Values of a SubmodelElementList of Properties */
function textList (parent: SubmodelElementLike | undefined | null, idShort: string): string[] {
  return children(child(parent, idShort))
    .map(element => element.value)
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
}

function fileElement (parent: SubmodelElementLike | undefined | null, idShort: string): SubmodelElementLike | null {
  const file = child(parent, idShort)
  return file && typeof file.value === 'string' && file.value.trim() !== '' ? file : null
}

function parseApplication (application: SubmodelElementLike | undefined): Model3DApplication | null {
  if (!application) {
    return null
  }

  const parsed = {
    name: text(application, 'ApplicationName'),
    version: text(application, 'ApplicationVersion'),
    qualifier: text(application, 'ApplicationQualifier'),
    vendor: text(child(application, 'VendorOrganization'), 'OrganizationName')
      || text(child(application, 'VendorOrganization'), 'OrganizationOfficialName'),
  }
  return parsed.name || parsed.version || parsed.qualifier || parsed.vendor ? parsed : null
}

function parseExternalFile (externalFile: SubmodelElementLike): Model3DExternalFile {
  const host = child(externalFile, 'HostOrganization')
  return {
    url: text(externalFile, 'ExternalUrl'),
    identifier: text(externalFile, 'FileIdentifier'),
    host: text(host, 'OrganizationName') || text(host, 'OrganizationOfficialName'),
  }
}

function parseVersion (fileVersion: SubmodelElementLike, key: string): Model3DVersion {
  const format = child(fileVersion, 'FileFormat')
  const providingOrganization = child(fileVersion, 'ProvidingOrganization')

  return {
    key,
    title: langStrings(fileVersion, 'Title'),
    fileName: text(fileVersion, 'FileName'),
    versionId: text(fileVersion, 'FileVersionId') || text(fileVersion, 'FileVersionID'),
    status: text(fileVersion, 'StatusValue'),
    setDate: text(fileVersion, 'SetDate'),
    format: {
      name: text(format, 'FormatName'),
      version: text(format, 'FormatVersion'),
      qualifier: text(format, 'FormatQualifier'),
    },
    previewFile: fileElement(fileVersion, 'PreviewFile'),
    digitalFile: fileElement(fileVersion, 'DigitalFile'),
    externalFiles: children(child(fileVersion, 'ExternalFile'))
      .map(element => parseExternalFile(element))
      .filter(externalFile => externalFile.url !== ''),
    sourceApplication: parseApplication(child(fileVersion, 'SourceApplication')),
    providingOrganization: text(providingOrganization, 'OrganizationOfficialName')
      || text(providingOrganization, 'OrganizationName'),
  }
}

function parseBoundingBox (boundingBox: SubmodelElementLike): Model3DBoundingBox {
  const vector = child(boundingBox, 'CartBoundingVector')
  return {
    kind: text(boundingBox, 'BoundingBoxKind'),
    x: text(vector, 'X'),
    y: text(vector, 'Y'),
    z: text(vector, 'Z'),
  }
}

function parseClassification (classification: SubmodelElementLike): Model3DClassification {
  return {
    id: text(classification, 'ClassId'),
    name: langStrings(classification, 'ClassName'),
    system: text(classification, 'ClassificationSystem'),
  }
}

function parseModel (model: SubmodelElementLike, index: number): Model3DEntry {
  const file = child(model, 'File')
  const capability = child(model, 'Capability')
  const geometry = child(model, 'Geometry')
  const simplification = child(capability, 'Simplification')
  const fileIds = children(child(file, 'FileId'))

  return {
    key: `model-${index}`,
    isPrimary: fileIds.some(fileId => text(fileId, 'IsPrimary').toLowerCase() === 'true'),
    valueIds: fileIds.map(fileId => text(fileId, 'ValueId')).filter(valueId => valueId !== ''),
    versions: children(child(file, 'FileVersion')).map((version, versionIndex) =>
      parseVersion(version, `model-${index}-version-${versionIndex}`),
    ),
    consumingApplications: children(child(file, 'ConsumingApplication'))
      .map(application => parseApplication(application))
      .filter((application): application is Model3DApplication => application !== null),
    classifications: children(child(file, 'FileClassification')).map(element => parseClassification(element)),
    positivePurposes: textList(capability, 'PosModelPurpose'),
    negativePurposes: textList(capability, 'NegModelPurpose'),
    embeddedInfo: textList(capability, 'EmbeddedInfo'),
    states: textList(capability, 'State'),
    objectType: text(capability, 'ObjectType'),
    origin: text(capability, 'Origin'),
    simplification: simplification
      ? {
          description: text(simplification, 'Description'),
          reducedElements: textList(simplification, 'ReducedElements'),
        }
      : null,
    representation: text(geometry, 'Representation'),
    lengthUnit: text(geometry, 'LengthUnit'),
    boundingBoxes: children(child(geometry, 'CartBoundingBox')).map(element => parseBoundingBox(element)),
  }
}

/**
 * Converts an IDTA Models3D 1.0 submodel (with `path`s assigned by `setData`) into a flat, typed structure.
 * The `Model3D` list items have no idShort, so they are addressed by position. Everything except the list is optional.
 */
export function parseModels3D (submodel: SubmodelElementLike | undefined | null): Model3DEntry[] {
  return children(child(submodel, 'Model3D'))
    .filter(model => model.modelType === 'SubmodelElementCollection')
    .map((model, index) => parseModel(model, index))
}

/** The version to show by default: the most recent `SetDate`, otherwise the last one listed */
export function latestVersion (versions: Model3DVersion[]): Model3DVersion | undefined {
  return versions.reduce<Model3DVersion | undefined>(
    (latest, version) => (!latest || version.setDate >= latest.setDate ? version : latest),
    undefined,
  )
}

/** Picks the text of the preferred language, falling back to the first entry */
export function pickLangString (values: LangString[], language = 'en'): string {
  const entry = values.find(value => value.language?.toLowerCase() === language) ?? values[0]
  return entry?.text ?? ''
}

export function versionTitle (version: Model3DVersion | undefined, model: Model3DEntry, index: number): string {
  return (
    pickLangString(version?.title ?? [])
    || version?.fileName
    || model.valueIds[0]
    || `3D Model ${index + 1}`
  )
}

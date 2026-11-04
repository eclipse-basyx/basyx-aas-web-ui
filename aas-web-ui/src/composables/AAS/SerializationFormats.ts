export type SerializationFormat = 'plain-json' | 'plain-xml' | 'aasx-json' | 'aasx-xml'

export type SerializationFormatConfig = {
  title: string
  extension: string
  /** Accept header sent to GET /serialization in backend serialization mode. */
  backendAcceptHeader: string
  /** Shown when the backend may not support this format. */
  backendCompatibilityHint?: string
  blobContentType: string
  isPlain: boolean
  isAasx: boolean
  specFileName?: string
  specContentType?: string
}

const serializationFormatConfigMap: Record<SerializationFormat, SerializationFormatConfig> = {
  'plain-json': {
    title: 'Plain JSON',
    extension: 'json',
    backendAcceptHeader: 'application/json',
    blobContentType: 'application/json',
    isPlain: true,
    isAasx: false,
  },
  'plain-xml': {
    title: 'Plain XML',
    extension: 'xml',
    backendAcceptHeader: 'application/xml',
    blobContentType: 'application/xml',
    isPlain: true,
    isAasx: false,
  },
  'aasx-json': {
    title: 'AASX (JSON content)',
    extension: 'aasx',
    // The specification defines no media type for an AASX with JSON content; BaSyx Go accepts this one.
    backendAcceptHeader: 'application/aasx+json',
    backendCompatibilityHint: 'Backend serialization requests AASX with JSON content as application/aasx+json, '
      + 'which BaSyx Go supports but other servers (for example BaSyx Java) may refuse. '
      + 'Use "AASX (XML content)" or Client Packaging instead.',
    blobContentType: 'application/asset-administration-shell-package',
    isPlain: false,
    isAasx: true,
    specFileName: 'environment.json',
    specContentType: 'application/json',
  },
  'aasx-xml': {
    title: 'AASX (XML content)',
    extension: 'aasx',
    backendAcceptHeader: 'application/asset-administration-shell-package+xml',
    blobContentType: 'application/asset-administration-shell-package+xml',
    isPlain: false,
    isAasx: true,
    specFileName: 'environment.xml',
    specContentType: 'application/xml',
  },
}

export const serializationFormatOptions: Array<{ title: string, value: SerializationFormat }> = (
  Object.entries(serializationFormatConfigMap) as Array<[SerializationFormat, SerializationFormatConfig]>
).map(([value, config]) => ({
  title: config.title,
  value,
}))

export const defaultSerializationFormat: SerializationFormat = 'aasx-json'

export function getSerializationFormatConfig (format: SerializationFormat): SerializationFormatConfig {
  return serializationFormatConfigMap[format]
}

export function isPlainSerializationFormat (format: SerializationFormat): boolean {
  return getSerializationFormatConfig(format).isPlain
}

export function getSerializationFileExtension (format: SerializationFormat): string {
  return getSerializationFormatConfig(format).extension
}

export function detectImportFileKind (fileName: string): 'aasx' | 'json' | 'xml' | 'unknown' {
  const normalized = fileName.trim().toLowerCase()

  if (normalized.endsWith('.aasx')) {
    return 'aasx'
  }
  if (normalized.endsWith('.json')) {
    return 'json'
  }
  if (normalized.endsWith('.xml')) {
    return 'xml'
  }

  return 'unknown'
}

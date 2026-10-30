export type CadFormat = 'stl' | 'obj' | 'gltf'

const STL_CONTENT_TYPES = new Set([
  'application/sla',
  'application/vnd.ms-pki.stl',
  'application/stl',
  'model/stl',
  'text/stl',
  'text/x-stl',
  'text/x-sla',
])

const OBJ_CONTENT_TYPES = new Set(['application/obj', 'model/obj', 'text/obj'])

const GLTF_CONTENT_TYPES = new Set(['model/gltf+json', 'model/gltf-binary'])

const EXTENSION_FORMATS: Record<string, CadFormat> = {
  stl: 'stl',
  obj: 'obj',
  gltf: 'gltf',
  glb: 'gltf',
}

/**
 * Determines which loader is needed for a File element, based on its content type first and its file extension second.
 * The extension fallback covers files whose content type is missing or generic (e.g. `application/octet-stream`).
 *
 * @param {any} file - The File SubmodelElement (uses `contentType`, `value` and an optional `fileName`).
 * @returns {CadFormat | null} The detected format, or null if the file is not a supported CAD format.
 */
export function resolveCadFormat (file: any): CadFormat | null {
  const contentType = String(file?.contentType ?? '').split(';', 1)[0].trim().toLowerCase()

  if (STL_CONTENT_TYPES.has(contentType)) {
    return 'stl'
  }
  if (OBJ_CONTENT_TYPES.has(contentType)) {
    return 'obj'
  }
  if (GLTF_CONTENT_TYPES.has(contentType)) {
    return 'gltf'
  }

  for (const name of [file?.fileName, file?.value]) {
    const extension = fileExtension(name)
    if (extension && extension in EXTENSION_FORMATS) {
      return EXTENSION_FORMATS[extension]
    }
  }

  return null
}

function fileExtension (name: unknown): string {
  if (typeof name !== 'string') {
    return ''
  }
  const lastSegment = name.split(/[?#]/, 1)[0].split('/').pop() ?? ''
  const dotIndex = lastSegment.lastIndexOf('.')
  return dotIndex === -1 ? '' : lastSegment.slice(dotIndex + 1).toLowerCase()
}

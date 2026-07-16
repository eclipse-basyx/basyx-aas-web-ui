import { detectImportFileKind } from '@/composables/AAS/SerializationFormats'

export type AasUploadMode = 'client' | 'server'

export const DEFAULT_AAS_UPLOAD_MODE: AasUploadMode = 'server'

export function isServerAasUploadSupported (fileNames: string[]): boolean {
  return fileNames.every(fileName => detectImportFileKind(fileName) === 'aasx')
}

export function resolveAasUploadMode (
  fileNames: string[],
  preferredMode: AasUploadMode | null = null,
): AasUploadMode {
  if (!isServerAasUploadSupported(fileNames)) {
    return 'client'
  }

  return preferredMode ?? DEFAULT_AAS_UPLOAD_MODE
}

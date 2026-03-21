import type { LangString, SubmodelElementLike } from '../types'

export function asSubmodelElementArray (value: unknown): SubmodelElementLike[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is SubmodelElementLike => typeof entry === 'object' && entry !== null)
    : []
}

export function getDescriptionArray (element: SubmodelElementLike): unknown[] {
  return Array.isArray(element.description) ? element.description : []
}

export function getLangSets (element: SubmodelElementLike): LangString[] {
  const values = asSubmodelElementArray(element.value)
  return values.filter((entry): entry is LangString => {
    return (
      typeof entry === 'object'
      && entry !== null
      && 'text' in entry
      && String((entry as LangString).text ?? '').length > 0
    )
  })
}

export function getPreviewFile (versionSmc: SubmodelElementLike | null | undefined): SubmodelElementLike | null {
  const children = asSubmodelElementArray(versionSmc?.value)
  return children.find(entry => entry.modelType === 'File' && entry.idShort === 'PreviewFile') ?? null
}

export function getDigitalFiles (versionSmc: SubmodelElementLike | null | undefined): SubmodelElementLike[] {
  const children = asSubmodelElementArray(versionSmc?.value)
  const digitalFilesSml = children.find(
    entry => entry.modelType === 'SubmodelElementList' && entry.idShort === 'DigitalFiles',
  )

  return asSubmodelElementArray(digitalFilesSml?.value)
}

export function hasAttachments (versionSmc: SubmodelElementLike | null | undefined): boolean {
  return !!getPreviewFile(versionSmc) || getDigitalFiles(versionSmc).length > 0
}

export function getDisplayTitleOrFallback (label: string, fallbackPrefix: string, index: number): string {
  return label.trim().length > 0 ? label : `${fallbackPrefix} ${index + 1}`
}

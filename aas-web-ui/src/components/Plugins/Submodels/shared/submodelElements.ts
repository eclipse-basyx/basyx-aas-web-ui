import type { Key, LangString, SubmodelElementLike } from './types'

/** Child elements of a Submodel (`submodelElements`), a collection or a list (`value`) */
export function children (parent: SubmodelElementLike | undefined | null): SubmodelElementLike[] {
  if (Array.isArray(parent?.submodelElements)) {
    return parent.submodelElements
  }
  return Array.isArray(parent?.value) ? parent.value : []
}

/** Values of the keys of a Reference, e.g. a semanticId or valueId */
export function keyValues (reference: { keys?: Key[] } | undefined | null): string[] {
  return Array.isArray(reference?.keys) ? reference.keys.map(key => key.value ?? '') : []
}

/**
 * Looks up a child by idShort first. Instances created from an IDTA template may carry a numeric suffix
 * (e.g. `Report01`), so a trailing number is tolerated. Only if no idShort matches, the semanticId is compared
 * (`…/<name>`, optionally followed by version and revision). The idShort comes first because some IDTA examples
 * use wrong semanticIds, e.g. `LabInformation` in IDTA 02102 v1.0 carries the one of `ReportComment`.
 */
export function child (parent: SubmodelElementLike | undefined | null, name: string): SubmodelElementLike | undefined {
  const elements = children(parent)
  const byIdShort = new RegExp(String.raw`^${name}\d*$`, 'i')
  const bySemanticId = new RegExp(String.raw`/${name}(?:/\d+){0,2}/?$`, 'i')

  return elements.find(element => byIdShort.test(element?.idShort ?? ''))
    ?? elements.find(element => keyValues(element?.semanticId).some(value => bySemanticId.test(value)))
}

/** Display text of a Property or MultiLanguageProperty, '' for any other element */
export function textOf (element: SubmodelElementLike | undefined | null): string {
  const value = element?.value
  if (element?.modelType === 'MultiLanguageProperty') {
    return Array.isArray(value) ? pickLangString(value) : ''
  }
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : ''
}

/** Display text of the child `name`, see `child` and `textOf` */
export function text (parent: SubmodelElementLike | undefined | null, name: string): string {
  return textOf(child(parent, name))
}

/** The File element if it has a non-empty value, otherwise null */
export function nonEmptyFile (file: SubmodelElementLike | undefined | null): SubmodelElementLike | null {
  return file && typeof file.value === 'string' && file.value.trim() !== '' ? file : null
}

/** Text in the given language, otherwise the first available text */
export function pickLangString (values: LangString[], language = 'en'): string {
  const entry = values.find(value => value.language?.toLowerCase() === language) ?? values[0]
  return entry?.text ?? ''
}

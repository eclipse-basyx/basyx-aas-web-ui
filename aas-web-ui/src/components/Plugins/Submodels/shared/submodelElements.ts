import type { LangString, SubmodelElementLike } from './types'

/** Child elements of a Submodel (`submodelElements`), a collection or a list (`value`) */
export function children (parent: SubmodelElementLike | undefined | null): SubmodelElementLike[] {
  if (Array.isArray(parent?.submodelElements)) {
    return parent.submodelElements
  }
  return Array.isArray(parent?.value) ? parent.value : []
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

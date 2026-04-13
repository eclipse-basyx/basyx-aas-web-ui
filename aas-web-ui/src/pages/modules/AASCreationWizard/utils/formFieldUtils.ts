import type { FormStateObject, FormStateValue } from '../types/form'
import type { LangString } from '../types/template'
import { ensurelangStrings } from './langStringFormUtils'

export function asString (value: FormStateValue): string {
  console.log('value is', typeof value === 'string' ? value : '')
  return typeof value === 'string' ? value : ''
}

export function asLangStrings (value: FormStateValue): LangString[] {
  return ensurelangStrings(value)
}

export function asFile (value: FormStateValue): File | null {
  return value instanceof File ? value : null
}
export function formatLabel (idShort: string): string {
  return idShort.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function asFormStateObject (value: FormStateValue): FormStateObject {
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof File)) {
    return value as FormStateObject
  }

  return {}
}
export function asFormStateObjectArray (value: FormStateValue): FormStateObject[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: FormStateObject[] = []

  for (const entry of value) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry) && !(entry instanceof File)) {
      result.push(entry as FormStateObject)
    }
  }

  return result
}

export function asStringArray (value: FormStateValue): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: string[] = []

  for (const entry of value) {
    if (typeof entry === 'string') {
      result.push(entry)
    }
  }

  return result
}

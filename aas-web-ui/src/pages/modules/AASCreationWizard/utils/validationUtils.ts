import type { FormStateObject, FormStateValue } from '../types/form'
import type { LangString, TemplateElement } from '../types/template'
import type { ValidationIssue, ValidationResult } from '../types/validation'
import {
  isOptionalSingleElement,
  isRepeatableElement,
  isRequiredElement,
} from './cardinalityUtils'

function isLangStringArray (value: unknown): value is LangString[] {
  return (
    Array.isArray(value)
    && value.every(
      entry =>
        typeof entry === 'object'
        && entry !== null
        && 'language' in entry
        && 'text' in entry,
    )
  )
}

export function isEmptyFormValue (value: FormStateValue): boolean {
  if (value === null) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim() === ''
  }

  if (value instanceof File) {
    return false
  }

  if (isLangStringArray(value)) {
    return !value.some(entry => {
      const text = (entry as { text?: unknown }).text
      return typeof text === 'string' && text.trim() !== ''
    })
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === 'object') {
    return false
  }

  return true
}

function buildIssue (path: string, element: TemplateElement, message: string): ValidationIssue {
  return {
    path,
    idShort: element.idShort,
    message,
  }
}

export function validateElementValue (
  element: TemplateElement,
  value: FormStateValue,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  const required = isRequiredElement(element)
  const repeatable = isRepeatableElement(element)
  const optionalSingle = isOptionalSingleElement(element)

  if (repeatable) {
    if (!Array.isArray(value)) {
      issues.push(buildIssue(path, element, 'Expected a repeatable value.'))
      return issues
    }

    if (required && value.length === 0) {
      issues.push(buildIssue(path, element, 'At least one entry is required.'))
    }

    return issues
  }

  if (optionalSingle) {
    return issues
  }

  if (required && isEmptyFormValue(value)) {
    issues.push(buildIssue(path, element, 'This field is required.'))
  }

  return issues
}
export function validateTemplateElements (
  elements: TemplateElement[],
  formState: FormStateObject,
  parentPath = '',
): ValidationResult {
  const issues: ValidationIssue[] = []

  for (const element of elements) {
    const currentPath = parentPath ? `${parentPath}.${element.idShort}` : element.idShort
    const value = formState[element.idShort]

    issues.push(...validateElementValue(element, value, currentPath))

    // Single-state SMC: value stored as object
    if (element.modelType === 'SubmodelElementCollection'
      && value
      && typeof value === 'object'
      && !Array.isArray(value)
      && !(value instanceof File)
    ) {
      const nestedState = value as FormStateObject
      const nestedResult = validateTemplateElements(
        element.value,
        nestedState,
        currentPath,
      )
      issues.push(...nestedResult.issues)
    }
    // Repeatable SMC: value stored as array
    if (
      element.modelType === 'SubmodelElementCollection'
      && Array.isArray(value)
    ) {
      for (const [index, item] of value.entries()) {
        if (
          item
          && typeof item === 'object'
          && !Array.isArray(item)
          && !(item instanceof File)
        ) {
          const itemState = item as FormStateObject
          const itemPath = `${currentPath}[${index}]`

          const nestedResult = validateTemplateElements(
            element.value,
            itemState,
            itemPath,
          )
          issues.push(...nestedResult.issues)
        }
      }
    }
    if (element.modelType === 'SubmodelElementList' && Array.isArray(value)) {
      for (const [index, item] of value.entries()) {
        if (
          item
          && typeof item === 'object'
          && !Array.isArray(item)
          && !(item instanceof File)
        ) {
          const itemState = item as FormStateObject
          const itemPath = `${currentPath}[${index}]`

          const itemTemplate = element.value[0]
          if (
            itemTemplate
            && itemTemplate.modelType === 'SubmodelElementCollection'
          ) {
            const nestedResult = validateTemplateElements(
              itemTemplate.value,
              itemState,
              itemPath,
            )
            issues.push(...nestedResult.issues)
          }
        }
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

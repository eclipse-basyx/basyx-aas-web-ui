import type { FormStateObject, FormStateValue } from '../types/form'
import type {
  SubmodelElementCollectionElement,
  // SubmodelElementListElement,
  SubmodelTemplate,
  TemplateElement,
} from '../types/template'
import {
  isOptionalSingleElement,
  isRepeatableElement,
  isRequiredElement,
} from './cardinalityUtils'

export function createInitialFormState (templateOrElements: SubmodelTemplate | TemplateElement[]): FormStateObject {
  const elements = Array.isArray(templateOrElements) ? templateOrElements : templateOrElements.submodelElements

  const state: FormStateObject = {}

  for (const element of elements) {
    state[element.idShort] = createInitialValueForElement(element)
  }

  return state
}

function createInitialValueForElement (element: TemplateElement): FormStateValue {
  if (isRepeatableElement(element)) {
    return []
  }

  if (isOptionalSingleElement(element)) {
    return null
  }
  switch (element.modelType) {
    case 'Property': {
      return ''
    }

    case 'MultiLanguageProperty': {
      return [{ language: 'en', text: '' }]
    }

    case 'File': {
      return null
    }

    case 'SubmodelElementCollection': {
      const collection = element as SubmodelElementCollectionElement
      return Array.isArray(collection.value) ? createInitialFormState(collection.value) : {}
    }

    case 'SubmodelElementList': {
      return []
    }

    default: {
      return ''
    }
  }
}

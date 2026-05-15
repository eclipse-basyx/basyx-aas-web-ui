import type {
  FileElement,
  MultiLanguagePropertyElement,
  PropertyElement,
  RangeElement,
  SubmodelElementCollectionElement,
  SubmodelElementListElement,
  TemplateElement,
} from '../types/template'

export function isPropertyElement (element: TemplateElement): element is PropertyElement {
  return element.modelType === 'Property'
}

export function isMultiLanguagePropertyElement (element: TemplateElement): element is MultiLanguagePropertyElement {
  return element.modelType === 'MultiLanguageProperty'
}

export function isFileElement (element: TemplateElement): element is FileElement {
  return element.modelType === 'File'
}

export function isRangeElement (element: TemplateElement): element is RangeElement {
  return element.modelType === 'Range'
}

export function isLeafElement (element: TemplateElement): boolean {
  return isPropertyElement(element) || isMultiLanguagePropertyElement(element) || isFileElement(element) || isRangeElement(element)
}

export function isSubmodelElementCollectionElement (
  element: TemplateElement,
): element is SubmodelElementCollectionElement {
  return element.modelType === 'SubmodelElementCollection'
}

export function isSubmodelElementListElement (element: TemplateElement): element is SubmodelElementListElement {
  return element.modelType === 'SubmodelElementList'
}

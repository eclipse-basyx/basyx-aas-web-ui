// import type { FormStateObject } from '../types/form'
// import type { SubmodelElementCollectionElement, SubmodelElementListElement, TemplateElement } from '../types/template'
// import { createInitialFormState } from './createInitialFormState'

// export function getListItemTemplate (element: SubmodelElementListElement): TemplateElement | null {
//   return element.value?.[0] ?? null
// }

// function asSingleListItemElement (element: TemplateElement): TemplateElement {
//   if (!element._cardinality) {
//     return element
//   }

//   return {
//     ...element,
//     _cardinality: {
//       ...element._cardinality,
//       repeatable: false,
//       maxOccurs: 1,
//     },
//   }
// }

// export function getListItemRendererElements (
//   element: SubmodelElementListElement,
// ): TemplateElement[] {
//   const itemTemplate = getListItemTemplate(element)

//   if (!itemTemplate) {
//     return []
//   }

//   if (itemTemplate.modelType === 'SubmodelElementCollection') {
//     return itemTemplate.value
//   }

//   return [asSingleListItemElement(itemTemplate)]
// }

// export function createSubmodelListItem (
//   element: SubmodelElementListElement,
// ): FormStateObject {
//   const itemTemplate = getListItemTemplate(element)

//   if (!itemTemplate) {
//     return {}
//   }

//   if (itemTemplate.modelType === 'SubmodelElementCollection') {
//     return createInitialFormState(itemTemplate.value)
//   }

//   return createInitialFormState([asSingleListItemElement(itemTemplate)])
// }
// // export function createSubmodelListTemplate (element: SubmodelElementListElement): FormStateObject {
// //   const itemTemplate = getListItemCollectionTemplate(element)
// //   if (!itemTemplate) {
// //     return {}
// //   }
// //   return createInitialFormState(element.value)
// // }

// export function appendListItem (items: FormStateObject[], newItem: FormStateObject): FormStateObject[] {
//   return [...items, newItem]
// }

// export function removeListItem (items: FormStateObject[], index: number): FormStateObject[] {
//   const item = [...items]
//   item.splice(index, 1)
//   return item
// }

// export function updateListItem (items: FormStateObject[], index: number, value: FormStateObject): FormStateObject[] {
//   const item = [...items]
//   item[index] = value
//   return item
// }

// export function addopenPanelIndex (openPanels: number[], newIndex: number): number[] {
//   return [...openPanels, newIndex]
// }

// export function removeAndReindexOpenPanels (openPanels: number[], removedIndex: number): number[] {
//   return openPanels
//     .filter(panelIndex => panelIndex !== removedIndex)
//     .map(panelIndex => (panelIndex > removedIndex ? panelIndex - 1 : panelIndex))
// }
import type { FormStateObject } from '../types/form'
import type {
  SubmodelElementListElement,
  TemplateElement,
} from '../types/template'
import { createInitialFormState } from './createInitialFormState'

export function getListItemTemplate (
  element: SubmodelElementListElement,
): TemplateElement | null {
  return element.value?.[0] ?? null
}

function createFallbackListItemIdShort (
  listIdShort: string,
): string {
  if (listIdShort.endsWith('ies')) {
    return `${listIdShort.slice(0, -3)}y`
  }

  if (listIdShort.endsWith('s')) {
    return listIdShort.slice(0, -1)
  }

  return listIdShort
}

function withSafeListItemIdShort (
  listElement: SubmodelElementListElement,
  itemTemplate: TemplateElement,
): TemplateElement {
  const hasValidIdShort
    = typeof itemTemplate.idShort === 'string'
      && itemTemplate.idShort.trim() !== ''

  return {
    ...itemTemplate,
    idShort: hasValidIdShort
      ? itemTemplate.idShort
      : createFallbackListItemIdShort(listElement.idShort),
  }
}

function asSingleListItemElement (
  listElement: SubmodelElementListElement,
  itemTemplate: TemplateElement,
): TemplateElement {
  const elementWithIdShort = withSafeListItemIdShort(listElement, itemTemplate)

  if (!elementWithIdShort._cardinality) {
    return elementWithIdShort
  }

  return {
    ...elementWithIdShort,
    _cardinality: {
      ...elementWithIdShort._cardinality,
      repeatable: false,
      maxOccurs: 1,
    },
  }
}

export function getListItemRendererElements (
  element: SubmodelElementListElement,
): TemplateElement[] {
  const itemTemplate = getListItemTemplate(element)

  if (!itemTemplate) {
    return []
  }

  if (itemTemplate.modelType === 'SubmodelElementCollection') {
    return itemTemplate.value
  }

  return [asSingleListItemElement(element, itemTemplate)]
}

export function createSubmodelListItem (
  element: SubmodelElementListElement,
): FormStateObject {
  const itemTemplate = getListItemTemplate(element)

  if (!itemTemplate) {
    return {}
  }

  if (itemTemplate.modelType === 'SubmodelElementCollection') {
    return createInitialFormState(itemTemplate.value)
  }

  return createInitialFormState([
    asSingleListItemElement(element, itemTemplate),
  ])
}

export function appendListItem (
  items: FormStateObject[],
  newItem: FormStateObject,
): FormStateObject[] {
  return [...items, newItem]
}

export function removeListItem (
  items: FormStateObject[],
  index: number,
): FormStateObject[] {
  const updated = [...items]
  updated.splice(index, 1)
  return updated
}

export function updateListItem (
  items: FormStateObject[],
  index: number,
  value: FormStateObject,
): FormStateObject[] {
  const updated = [...items]
  updated[index] = value
  return updated
}

export function addopenPanelIndex (
  openPanels: number[],
  newIndex: number,
): number[] {
  return [...openPanels, newIndex]
}

export function removeAndReindexOpenPanels (
  openPanels: number[],
  removedIndex: number,
): number[] {
  return openPanels
    .filter(panelIndex => panelIndex !== removedIndex)
    .map(panelIndex => (panelIndex > removedIndex ? panelIndex - 1 : panelIndex))
}

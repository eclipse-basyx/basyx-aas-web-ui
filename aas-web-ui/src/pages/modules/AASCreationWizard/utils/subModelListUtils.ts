import type { FormStateObject } from '../types/form'
import type { SubmodelElementListElement } from '../types/template'
import { createInitialSubmodelListItem } from './createInitialFormState'

export function createSubmodelListItem (
  element: SubmodelElementListElement,
): FormStateObject {
  return createInitialSubmodelListItem(element)
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

export { getListItemRendererElements, getListItemTemplate } from './submodelListTemplateUtils'

import { FormStateObject } from '../types/form';
import { SubmodelElementCollectionElement, SubmodelElementListElement } from '../types/template';
import { createInitialFormState } from './createInitialFormState';

export function getListItemCollectionTemplate(
    element: SubmodelElementListElement
): SubmodelElementCollectionElement | null {
    const firstItem = element.value?.[0];

    if (firstItem && firstItem.modelType === 'SubmodelElementCollection') {
        return firstItem as SubmodelElementCollectionElement;
    }

    return null;
}
export function createSubmodelListTemplate(element: SubmodelElementListElement): FormStateObject {
    const itemTemplate = getListItemCollectionTemplate(element);
    if (!itemTemplate) {
        return {};
    }
    return createInitialFormState(element.value);
}

export function appendListItem(items: FormStateObject[], newItem: FormStateObject): FormStateObject[] {
    return [...items, newItem];
}

export function removeListItem(items: FormStateObject[], index: number): FormStateObject[] {
    const item = [...items];
    item.splice(index, 1);
    return item;
}

export function updateListItem(items: FormStateObject[], index: number, value: FormStateObject): FormStateObject[] {
    const item = [...items];
    item[index] = value;
    return item;
}

export function addopenPanelIndex(openPanels: number[], newIndex: number): number[] {
    return [...openPanels, newIndex];
}

export function removeAndReindexOpenPanels(openPanels: number[], removedIndex: number): number[] {
    return openPanels
        .filter((panelIndex) => panelIndex !== removedIndex)
        .map((panelIndex) => (panelIndex > removedIndex ? panelIndex - 1 : panelIndex));
}

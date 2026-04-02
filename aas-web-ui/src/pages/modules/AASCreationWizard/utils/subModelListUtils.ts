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

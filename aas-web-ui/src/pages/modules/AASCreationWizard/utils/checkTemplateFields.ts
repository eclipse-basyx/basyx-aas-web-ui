import type { FileElement, MultiLanguagePropertyElement, PropertyElement, TemplateElement } from '../types/template';

export function isPropertyElement(element: TemplateElement): element is PropertyElement {
    return element.modelType === 'Property';
}

export function isMultiLanguagePropertyElement(element: TemplateElement): element is MultiLanguagePropertyElement {
    return element.modelType === 'MultiLanguageProperty';
}

export function isFileElement(element: TemplateElement): element is FileElement {
    return element.modelType === 'File';
}

export function isLeafElement(element: TemplateElement): boolean {
    return isPropertyElement(element) || isMultiLanguagePropertyElement(element) || isFileElement(element);
}

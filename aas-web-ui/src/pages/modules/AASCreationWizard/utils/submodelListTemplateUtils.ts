import type {
  SubmodelElementListElement,
  TemplateElement,
} from '../types/template'

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

export function asSingleListItemElement (
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

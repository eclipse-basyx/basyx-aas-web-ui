import type { FormStateObject, FormStateValue } from '../types/form'
import type {
  FileElement,
  HandoverDocumentationTemplate,
  MultiLanguagePropertyElement,
  PropertyElement,
  RangeElement,
  SubmodelElementCollectionElement,
  SubmodelElementListElement,
  TemplateElement,
} from '../types/template'
import { useIDUtils } from '@/composables/IDUtils'
import template from '../templates/handover-documentation.json'
import { isRepeatableElement } from '../utils/cardinalityUtils'
import {
  asFile,
  asFormStateObject,
  asFormStateObjectArray,
  asLangStrings,
  asRangeFormValue,
  asString,
  asStringArray,
} from '../utils/formFieldUtils'
import { normalizeHandoverDocumentationTemplate } from '../utils/normalizeTemplate'
import {
  getListItemRendererElements,
  getListItemTemplate,
} from '../utils/subModelListUtils'

const rawTemplate = template as HandoverDocumentationTemplate
const templateData = normalizeHandoverDocumentationTemplate(rawTemplate)

const { generateIri } = useIDUtils()

function stripRuntimeMetadata<T extends Record<string, unknown>> (element: T): T {
  const { _cardinality, ...rest } = element
  return rest as T
}

function formatIndexedIdShort (baseIdShort: string, index: number): string {
  const indexedPattern = /__\d{2}__$/

  if (indexedPattern.test(baseIdShort)) {
    return baseIdShort.replace(indexedPattern, `__${String(index).padStart(2, '0')}__`)
  }

  return `${baseIdShort}__${String(index).padStart(2, '0')}__`
}

function buildElement (
  element: TemplateElement,
  value: FormStateValue,
): TemplateElement[] {
  switch (element.modelType) {
    case 'Property': {
      return buildProperty(element, value)
    }

    case 'MultiLanguageProperty': {
      return buildMultiLanguageProperty(element, value)
    }

    case 'File': {
      return buildFile(element, value)
    }

    case 'Range': {
      return buildRange(element, value)
    }

    case 'SubmodelElementCollection': {
      return buildCollection(element, value)
    }

    case 'SubmodelElementList': {
      return buildList(element, value)
    }

    case 'ReferenceElement': {
      return []
    }
  }
}

function buildProperty (
  element: PropertyElement,
  value: FormStateValue,
): TemplateElement[] {
  if (isRepeatableElement(element)) {
    const values = asStringArray(value).filter(entry => entry.trim() !== '')

    return values.map((entry, index) => ({
      ...stripRuntimeMetadata(element),
      idShort: formatIndexedIdShort(element.idShort, index),
      value: entry,
    }))
  }

  const stringValue = asString(value)

  if (stringValue.trim() === '') {
    return []
  }

  return [{
    ...stripRuntimeMetadata(element),
    value: stringValue,
  }]
}

function buildMultiLanguageProperty (
  element: MultiLanguagePropertyElement,
  value: FormStateValue,
): TemplateElement[] {
  const langValues = asLangStrings(value).filter(entry => entry.text.trim() !== '')

  if (langValues.length === 0) {
    return []
  }

  return [{
    ...stripRuntimeMetadata(element),
    value: langValues,
  }]
}

function buildFile (
  element: FileElement,
  value: FormStateValue,
): TemplateElement[] {
  const fileValue = asFile(value)

  if (!fileValue) {
    return []
  }

  return [{
    ...stripRuntimeMetadata(element),
    contentType: fileValue.type || element.contentType || 'application/octet-stream',
    value: fileValue.name,
  }]
}

function buildRange (
  element: RangeElement,
  value: FormStateValue,
): TemplateElement[] {
  const rangeValue = asRangeFormValue(value)

  if (rangeValue.min.trim() === '' && rangeValue.max.trim() === '') {
    return []
  }

  return [{
    ...stripRuntimeMetadata(element),
    min: rangeValue.min,
    max: rangeValue.max,
  }]
}

function buildCollection (
  element: SubmodelElementCollectionElement,
  value: FormStateValue,
): TemplateElement[] {
  if (isRepeatableElement(element)) {
    const items = asFormStateObjectArray(value)

    return items
      .map((item, index) => buildRepeatableCollectionItem(element, item, index))
      .filter((item): item is SubmodelElementCollectionElement => item !== null)
  }

  const nestedState = asFormStateObject(value)

  const builtChildren = element.value.flatMap(child =>
    buildElement(child, nestedState[child.idShort]),
  )

  if (builtChildren.length === 0) {
    return []
  }

  return [{
    ...stripRuntimeMetadata(element),
    value: builtChildren,
  }]
}

function buildRepeatableCollectionItem (
  element: SubmodelElementCollectionElement,
  item: FormStateObject,
  index: number,
): SubmodelElementCollectionElement | null {
  const builtChildren = element.value.flatMap(child =>
    buildElement(child, item[child.idShort]),
  )

  if (builtChildren.length === 0) {
    return null
  }

  return {
    ...stripRuntimeMetadata(element),
    idShort: formatIndexedIdShort(element.idShort, index),
    value: builtChildren,
  }
}

function buildList (
  element: SubmodelElementListElement,
  value: FormStateValue,
): TemplateElement[] {
  const items = asFormStateObjectArray(value)

  if (items.length === 0) {
    return []
  }

  const itemTemplate = getListItemTemplate(element)

  if (!itemTemplate) {
    return []
  }

  const builtItems = itemTemplate.modelType === 'SubmodelElementCollection'
    ? buildCollectionListItems(element, items)
    : buildLeafListItems(element, items)

  if (builtItems.length === 0) {
    return []
  }

  return [{
    ...stripRuntimeMetadata(element),
    value: builtItems,
  }]
}

function buildCollectionListItems (
  list: SubmodelElementListElement,
  items: FormStateObject[],
): TemplateElement[] {
  const itemTemplate = getListItemTemplate(list)

  if (!itemTemplate || itemTemplate.modelType !== 'SubmodelElementCollection') {
    return []
  }

  return items
    .map((item, index) => {
      const builtChildren = itemTemplate.value.flatMap(child =>
        buildElement(child, item[child.idShort]),
      )

      if (builtChildren.length === 0) {
        return null
      }

      return {
        ...stripRuntimeMetadata(itemTemplate),
        idShort: formatIndexedIdShort(itemTemplate.idShort ?? list.idShort, index),
        value: builtChildren,
      }
    })
    .filter((item): item is SubmodelElementCollectionElement => item !== null)
}

function buildLeafListItems (
  list: SubmodelElementListElement,
  items: FormStateObject[],
): TemplateElement[] {
  const itemRendererElements = getListItemRendererElements(list)

  if (itemRendererElements.length === 0) {
    return []
  }

  return items.flatMap((item, index) =>
    itemRendererElements.flatMap(itemElement => {
      const builtElements = buildElement(itemElement, item[itemElement.idShort])

      return builtElements.map(builtElement => ({
        ...builtElement,
        idShort: formatIndexedIdShort(builtElement.idShort, index),
      }))
    }),
  )
}

export function buildHandoverDocumentation (
  rawData: FormStateObject | null = null,
): HandoverDocumentationTemplate {
  const existingData = rawData ?? {}

  const builtElements = templateData.submodelElements.flatMap(element =>
    buildElement(element, existingData[element.idShort]),
  )

  return {
    ...stripRuntimeMetadata(templateData),
    id: generateIri('Submodel'),
    kind: 'Instance',
    submodelElements: builtElements,
  }
}

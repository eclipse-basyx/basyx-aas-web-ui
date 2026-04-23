import type { FormStateObject, FormStateValue } from '../types/form'
import type {
  DigitalNameplateTemplate,
  SubmodelElementCollectionElement,
  SubmodelElementListElement,
  TemplateElement,
} from '../types/template'
import { useIDUtils } from '@/composables/IDUtils'
import template from '../templates/digital-nameplate.json'
import { isRepeatableElement } from '../utils/cardinalityUtils'
import {
  asFile,
  asFormStateObject,
  asFormStateObjectArray,
  asLangStrings,
  asString,
  asStringArray,
} from '../utils/formFieldUtils'
import { normalizeDigitalNameplateTemplate } from '../utils/normalizeTemplate'

const rawTemplate = template as DigitalNameplateTemplate
const templateData = normalizeDigitalNameplateTemplate(rawTemplate)

// Composables
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

function buildElement (element: TemplateElement, value: FormStateValue): TemplateElement [] {
  switch (element.modelType) {
    case 'Property': {
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

    case 'MultiLanguageProperty': {
      const langValues = asLangStrings(value).filter(entry => entry.text.trim() !== '')

      if (langValues.length === 0) {
        return []
      }

      return [{
        ...stripRuntimeMetadata(element),
        value: langValues,
      }]
    }

    case 'File': {
      const fileValue = asFile(value)

      if (!fileValue) {
        return []
      }

      return [{
        ...stripRuntimeMetadata(element),
        value: fileValue.name,
      }]
    }

    case 'SubmodelElementCollection': {
      const collection = element as SubmodelElementCollectionElement

      if (isRepeatableElement(collection)) {
        const items = asFormStateObjectArray(value)

        return items
          .map((item, index) => buildRepeatableCollectionItem(collection, item, index))
          .filter((item): item is SubmodelElementCollectionElement => item !== null)
      }

      const nestedState = asFormStateObject(value)

      const builtChildren = collection.value
        .flatMap(child => buildElement(child, nestedState[child.idShort]))

      if (builtChildren.length === 0) {
        return []
      }

      return [{
        ...stripRuntimeMetadata(collection),
        value: builtChildren,
      }]
    }

    case 'SubmodelElementList': {
      const list = element as SubmodelElementListElement
      const items = asFormStateObjectArray(value)

      const itemTemplate = list.value[0]

      if (!itemTemplate || itemTemplate.modelType !== 'SubmodelElementCollection') {
        return []
      }

      const builtItems = items
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

      if (builtItems.length === 0) {
        return []
      }

      return [{
        ...stripRuntimeMetadata(list),
        value: builtItems,
      }]
    }
    case 'ReferenceElement': {
      return [] // unused in digitalNameplate
    }

    case 'Range': {
      return [] // unused in digitalNameplate
    }
  }
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

export function buildDigitalNameplate (rawData: FormStateObject | null = null): DigitalNameplateTemplate {
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

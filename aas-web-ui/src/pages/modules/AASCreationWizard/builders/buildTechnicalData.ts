import type { FormStateObject, FormStateValue, RangeFormValue } from '../types/form'
import type {
  SubmodelElementCollectionElement,
  SubmodelElementListElement,
  TechnicalDataTemplate,
  TemplateElement,
} from '../types/template'
import type {
  ArbitraryMultiLanguagePropertyNode, ArbitraryNode,
  ArbitraryPropertyNode, ArbitraryRangeNode,
  ArbitrarySectionNode, TechnicalPropertyAreaEditorItem } from './../types/arbitrary'
import { useIDUtils } from '@/composables/IDUtils'
import template from '../templates/technical-data.json'
import { formatIndexedIdShort, stripRuntimeMetadata } from '../utils/builderUtils'
import { isRepeatableElement } from '../utils/cardinalityUtils'
import {
  asFile,
  asFormStateObject,
  asFormStateObjectArray,
  asLangStrings,
  asString,
  asStringArray,
} from '../utils/formFieldUtils'
import { createUniqueIdShort } from '../utils/idShortUtils'
import { normalizeTechnicalDataTemplate } from '../utils/normalizeTemplate'

const rawTemplate = template as TechnicalDataTemplate
const templateData = normalizeTechnicalDataTemplate(rawTemplate)

const { generateIri } = useIDUtils()

type BuiltArbitrarySubmodelElement
  = | BuiltArbitraryProperty
    | BuiltArbitraryMultiLanguageProperty
    | BuiltArbitraryRange
    | BuiltArbitraryCollection

type BuiltArbitraryProperty = {
  modelType: 'Property'
  idShort: string
  valueType: string
  value: string
}

type BuiltArbitraryMultiLanguageProperty = {
  modelType: 'MultiLanguageProperty'
  idShort: string
  value: {
    language: string
    text: string
  }[]
}

type BuiltArbitraryRange = {
  modelType: 'Range'
  idShort: string
  valueType: string
  min: string
  max: string
}

type BuiltArbitraryCollection = {
  modelType: 'SubmodelElementCollection'
  idShort: string
  value: BuiltArbitrarySubmodelElement[]
}

type BuiltTechnicalPropertyArea = {
  modelType: 'SubmodelElementCollection'
  idShort: string
  value: BuiltArbitrarySubmodelElement[]
}

export function buildArbitrarySubmodelElements (
  nodes: ArbitraryNode[],
): BuiltArbitrarySubmodelElement[] {
  const usedIdShorts = new Set<string>()

  return nodes
    .map(node => buildArbitrarySubmodelElement(node, usedIdShorts))
    .filter((element): element is BuiltArbitrarySubmodelElement => element !== null)
}

function buildArbitrarySubmodelElement (
  node: ArbitraryNode,
  usedIdShorts: Set<string>,
): BuiltArbitrarySubmodelElement | null {
  switch (node.type) {
    case 'property': {
      return buildArbitraryProperty(node, usedIdShorts)
    }

    case 'multiLanguageProperty': {
      return buildArbitraryMultiLanguageProperty(node, usedIdShorts)
    }

    case 'range': {
      return buildArbitraryRange(node, usedIdShorts)
    }

    case 'section': {
      return buildArbitrarySection(node, usedIdShorts)
    }

    default: {
      return null
    }
  }
}

function buildArbitraryProperty (
  node: ArbitraryPropertyNode,
  usedIdShorts: Set<string>,
): BuiltArbitraryProperty {
  return {
    modelType: 'Property',
    idShort: createUniqueIdShort(node.label, usedIdShorts, 'Property'),
    valueType: node.valueType ?? 'xs:string',
    value: node.value,
  }
}

function buildArbitraryMultiLanguageProperty (
  node: ArbitraryMultiLanguagePropertyNode,
  usedIdShorts: Set<string>,
): BuiltArbitraryMultiLanguageProperty {
  return {
    modelType: 'MultiLanguageProperty',
    idShort: createUniqueIdShort(node.label, usedIdShorts, 'MultiLanguageProperty'),
    value: node.value,
  }
}

function buildArbitraryRange (
  node: ArbitraryRangeNode,
  usedIdShorts: Set<string>,
): BuiltArbitraryRange {
  return {
    modelType: 'Range',
    idShort: createUniqueIdShort(node.label, usedIdShorts, 'Range'),
    valueType: node.valueType ?? 'xs:string',
    min: node.min,
    max: node.max,
  }
}

function buildArbitrarySection (
  node: ArbitrarySectionNode,
  usedIdShorts: Set<string>,
): BuiltArbitraryCollection {
  return {
    modelType: 'SubmodelElementCollection',
    idShort: createUniqueIdShort(node.label, usedIdShorts, 'Section'),
    value: buildArbitrarySubmodelElements(node.children),
  }
}

//  build the technical property areas
export function buildTechnicalPropertyAreas (
  areas: TechnicalPropertyAreaEditorItem[],
): BuiltTechnicalPropertyArea[] {
  return areas.map((area, index) => ({
    modelType: 'SubmodelElementCollection',
    idShort: `TechnicalPropertyArea_${String(index).padStart(2, '0')}`,
    value: buildArbitrarySubmodelElements(area.arbitraryNodes),
  }))
}

function asRangeFormValue (value: FormStateValue): RangeFormValue {
  if (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && 'min' in value
    && 'max' in value
  ) {
    return value as RangeFormValue
  }

  return {
    min: '',
    max: '',
  }
}

function buildElement (element: TemplateElement, value: FormStateValue): TemplateElement[] {
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

    case 'MultiLanguageProperty' : {
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

    case 'Range': {
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

    case 'SubmodelElementCollection': {
      const collection = element as SubmodelElementCollectionElement

      if (isRepeatableElement(collection)) {
        const items = asFormStateObjectArray(value)

        return items
          .map((item, index) => buildRepeatableCollectionItem(collection, item, index))
          .filter((item): item is SubmodelElementCollectionElement => item !== null)
      }

      const nestedState = asFormStateObject(value)

      const builtChildren = collection.value.flatMap(child =>
        buildElement(child, nestedState[child.idShort]),
      )

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
      return []
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

export function buildTechnicalData (
  rawData: FormStateObject | null = null,
  technicalPropertyAreas: TechnicalPropertyAreaEditorItem[] = [],
): TechnicalDataTemplate {
  const existingData = rawData ?? {}

  const fixedElements = templateData.submodelElements
    .filter(element => element.idShort !== 'TechnicalPropertyAreas')
    .flatMap(element => buildElement(element, existingData[element.idShort]))

  const technicalPropertyAreasElement = buildTechnicalPropertyAreasElement(technicalPropertyAreas)

  const submodelElements = technicalPropertyAreasElement
    ? [...fixedElements, technicalPropertyAreasElement]
    : fixedElements

  return {
    ...stripRuntimeMetadata(templateData),
    id: generateIri('Submodel'),
    kind: 'Instance',
    submodelElements,
  }
}

function buildTechnicalPropertyAreasElement (
  areas: TechnicalPropertyAreaEditorItem[],
): SubmodelElementListElement | null {
  const builtAreas = buildTechnicalPropertyAreas(areas)

  if (builtAreas.length === 0) {
    return null
  }

  const templateElement = templateData.submodelElements.find(
    element => element.idShort === 'TechnicalPropertyAreas',
  )

  if (!templateElement || templateElement.modelType !== 'SubmodelElementList') {
    return null
  }

  return {
    ...stripRuntimeMetadata(templateElement as SubmodelElementListElement),
    value: builtAreas as unknown as SubmodelElementCollectionElement[],
  }
}

import type {
  DigitalNameplateTemplate,
  SubmodelElementCollectionElement,
  TemplateElement,
} from '../types/template'
import contactInformationSmc from '../templates/contact-information-smc.json'
import { parseCardinality } from './cardinalityUtils'

function deepClone<T> (value: T): T {
  return structuredClone(value) as T
}

function isAddressInformationElement (
  element: TemplateElement,
): element is SubmodelElementCollectionElement {
  return (
    element.modelType === 'SubmodelElementCollection'
    && element.idShort === 'AddressInformation'
  )
}

function isEmptyCollection (element: SubmodelElementCollectionElement): boolean {
  return !Array.isArray(element.value) || element.value.length === 0
}

function normalizeElement (element: TemplateElement): TemplateElement | null {
  if (element.idShort === 'AssetSpecificProperties') {
    return null
  }

  if (isAddressInformationElement(element) && isEmptyCollection(element)) {
    const reusableSmc = deepClone(
      contactInformationSmc,
    ) as SubmodelElementCollectionElement

    return {
      ...element,
      value: reusableSmc.value,
      _cardinality: parseCardinality(element),
    }
  }

  if (element.modelType === 'SubmodelElementCollection') {
    return {
      ...element,
      value: element.value
        .map(child => normalizeElement(child))
        .filter((child): child is TemplateElement => child !== null),
      _cardinality: parseCardinality(element),
    }
  }

  if (element.modelType === 'SubmodelElementList') {
    return {
      ...element,
      value: element.value
        .map(child => normalizeElement(child))
        .filter((child): child is TemplateElement => child !== null),
      _cardinality: parseCardinality(element),
    }
  }

  return {
    ...element,
    _cardinality: parseCardinality(element),
  }
}

export function normalizeTemplate (template: DigitalNameplateTemplate): DigitalNameplateTemplate {
  return {
    ...template,
    submodelElements: template.submodelElements
      .map(element => normalizeElement(element))
      .filter((element): element is TemplateElement => element !== null),
  }
}

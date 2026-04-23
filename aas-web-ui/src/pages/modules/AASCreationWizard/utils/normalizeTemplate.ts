import type {
  DigitalNameplateTemplate,
  SubmodelElementCollectionElement,
  SubmodelElementListElement,
  TechnicalDataTemplate,
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
function hasChildElementArray (element: TemplateElement): element is SubmodelElementCollectionElement | SubmodelElementListElement {
  return (
    (element.modelType === 'SubmodelElementCollection'
      || element.modelType === 'SubmodelElementList') && Array.isArray(element.value))
}

/**
 * Digital Nameplate specific normalization:
 * - removes AssetSpecificProperties
 * - injects ContactInformation children into AddressInformation
 * - adds cardinality recursively
 */
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

/**
 * Generic normalization:
 * - only adds cardinality recursively
 * - no template-specific structural changes
 */
// function addCardinality (element: TemplateElement): TemplateElement {
//   if (hasChildElementArray(element)) {
//     return {
//       ...element,
//       value: element.value.map(child => addCardinality(child)),
//       _cardinality: parseCardinality(element),

//     }
//   }
//   return {
//     ...element,
//     _cardinality: parseCardinality(element),
//   }
// }

/**
 * Technical Data normalization:
 * - removes ReferenceElement
 * - adds cardinality recursively
 */

function normalizeTechnicaldataElement (element: TemplateElement): TemplateElement | null {
  if (element.modelType === 'ReferenceElement') {
    return null
  }

  if (hasChildElementArray(element)) {
    return {
      ...element,
      value: element.value
        .map (child => normalizeTechnicaldataElement(child))
        .filter((child): child is TemplateElement => child !== null),
      _cardinality: parseCardinality(element),
    }
  }

  return {
    ...element,
    _cardinality: parseCardinality(element),
  }
}
/**
 * Handover Documentation normalization:
 * - removes ReferenceElement
 * - adds cardinality recursively
 */
function normalizeHandoverDocumentationElement (element: TemplateElement): TemplateElement | null {
  if (element.modelType === 'ReferenceElement') {
    return null
  }
  if (hasChildElementArray(element)) {
    return {
      ...element,
      value: element.value.map(child => normalizeHandoverDocumentationElement(child)).filter((child): child is TemplateElement => child !== null),
      _cardinality: parseCardinality(element),
    }
  }

  return {
    ...element,
    _cardinality: parseCardinality(element),
  }
}

export function normalizeDigitalNameplateTemplate (template: DigitalNameplateTemplate): DigitalNameplateTemplate {
  return {
    ...template,
    submodelElements: template.submodelElements
      .map(element => normalizeElement(element))
      .filter((element): element is TemplateElement => element !== null),
  }
}

export function normalizeTechnicalDataTemplate (template: TechnicalDataTemplate): TechnicalDataTemplate {
  return {
    ...template,
    submodelElements: template.submodelElements
      .map(element => normalizeTechnicaldataElement(element))
      .filter((element): element is TemplateElement => element !== null),
  }
}

export function normalizeHandoverDocumentationTemplate (template: TechnicalDataTemplate): TechnicalDataTemplate {
  return {
    ...template,
    submodelElements: template.submodelElements
      .map(element => normalizeHandoverDocumentationElement(element))
      .filter((element): element is TemplateElement => element !== null),
  }
}

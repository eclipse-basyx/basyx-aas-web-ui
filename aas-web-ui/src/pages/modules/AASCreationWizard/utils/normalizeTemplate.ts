import type {
  DigitalNameplateTemplate,
  SubmodelElementCollectionElement,
  SubmodelElementListElement,
  TechnicalDataTemplate,
  TemplateElement,
} from '../types/template'
import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils'
import contactInformationSmc from '../templates/contact-information-smc.json'
import { parseCardinality } from './cardinalityUtils'

function deepClone<T> (value: T): T {
  return structuredClone(value) as T
}

function shouldExcludeSemanticId (element: TemplateElement, semanticId: string[]): boolean {
  return semanticId.some(semanticId =>
    checkSemanticId(element, semanticId),
  )
}

const ADDRESS_INFORMATION_SEMANTIC_ID = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/AddressInformation'
function isAddressInformationElement (
  element: TemplateElement,
): element is SubmodelElementCollectionElement {
  return (
    element.modelType === 'SubmodelElementCollection'
    && checkSemanticId(element, ADDRESS_INFORMATION_SEMANTIC_ID)
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
const EXCLUDED_DIGITAL_NAMEPLATE_SEMANTIC_IDS = [
  '0173-1#02-ABI218#003/0173-1#01-AGZ672#004',
]

function normalizeElement (element: TemplateElement): TemplateElement | null {
  if (shouldExcludeSemanticId(element, EXCLUDED_DIGITAL_NAMEPLATE_SEMANTIC_IDS)) {
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
 * Technical Data normalization:
 * - removes ReferenceElement
 * - adds cardinality recursively
 */
const EXCLUDED_TECHNICAL_DATA_REFERENCE_SEMANTIC_IDS = [
  '0173-1#02-ABL358#002',
]
const TECHNICAL_DATA_ARBITRARY_SEMANTIC_IDS = [
  'https://admin-shell.io/SMT/General/Arbitrary',
]

// function isTechnicalDataArbitraryElement (element: TemplateElement): boolean {
//   return [
//     'Section',
//     'ArbitrarySMC',
//     'ArbitrarySML',
//     'ArbitraryProperty',
//     'ArbitraryMLP',
//     'ArbitraryRange',
//   ].includes(element.idShort)
// }

function normalizeTechnicaldataElement (element: TemplateElement): TemplateElement | null {
  if (shouldExcludeSemanticId(element, EXCLUDED_TECHNICAL_DATA_REFERENCE_SEMANTIC_IDS)) {
    return null
  }
  if (shouldExcludeSemanticId(element, TECHNICAL_DATA_ARBITRARY_SEMANTIC_IDS)) {
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
const EXCLUDED_HANDOVER_SEMANTIC_IDS = [
  // idShort: Entities (SML)
  'https://admin-shell.io/vdi/2770/1/0/EntitiesForDocumentation',
  // idShort: Entity element of the Entities
  'https://admin-shell.io/vdi/2770/1/0/EntityForDocumentation',
  // idShort: RefersToEntities
  '0173-1#02-ABK288#002',
  // idShort: BasedOnReferences
  '0173-1#02-ABK289#002',
  // idShort: TranslationOfEntities
  '0173-1#02-ABK290#002',
  // idShort: DocumentedEntities
  'https://admin-shell.io/vdi/2770/1/0/Document/DocumentedEntities',
  // Documented Entitiy Reference
  'https://adminshell.io/vdi/2770/1/0/Document/DocumentedEntity',
]

function normalizeHandoverDocumentationElement (element: TemplateElement): TemplateElement | null {
  // if (element.modelType === 'ReferenceElement') {
  //   return null
  // }
  if (shouldExcludeSemanticId(element, EXCLUDED_HANDOVER_SEMANTIC_IDS)) {
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

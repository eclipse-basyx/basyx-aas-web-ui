import type { SubmodelElementLike } from '../../shared/types'
import type {
  FireReport,
  FireTest,
  LabInformation,
  ManufacturerInformation,
  Material,
  RailwayFireProtectionData,
  ReportLink,
  RequirementsSet,
} from '../types'
import { children, nonEmptyFile, pickLangString } from '../../shared/submodelElements'
import { parseHazardLevel } from './hazardLevel'
import { stripQuotes } from './text'

type Key = { type?: string, value?: string }

function semanticIdValues (element: SubmodelElementLike): string[] {
  const keys: Key[] = element?.semanticId?.keys ?? []
  return keys.map(key => key.value ?? '')
}

/**
 * Looks up a child by idShort first (a numeric suffix such as `Report01` is tolerated). Only if no idShort
 * matches, the semanticId is compared (`…/cds/<Name>/1`). The idShort comes first because the IDTA 02102 v1.0
 * example uses wrong semanticIds for some elements, e.g. `LabInformation` carries the one of `ReportComment`.
 */
function child (parent: SubmodelElementLike | undefined | null, name: string): SubmodelElementLike | undefined {
  const elements = children(parent)
  const byIdShort = new RegExp(String.raw`^${name}\d*$`, 'i')
  const bySemanticId = new RegExp(String.raw`/${name}(?:/\d+){0,2}/?$`, 'i')

  return elements.find(element => byIdShort.test(element?.idShort ?? ''))
    ?? elements.find(element => semanticIdValues(element).some(value => bySemanticId.test(value)))
}

/** Display text of a Property or MultiLanguageProperty */
function textOf (element: SubmodelElementLike | undefined | null): string {
  if (!element) {
    return ''
  }
  const value = element.value
  if (element.modelType === 'MultiLanguageProperty' || Array.isArray(value)) {
    return element.modelType === 'MultiLanguageProperty' && Array.isArray(value) ? stripQuotes(pickLangString(value)) : ''
  }
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? stripQuotes(String(value))
    : ''
}

function text (parent: SubmodelElementLike | undefined | null, name: string): string {
  return textOf(child(parent, name))
}

function parseManufacturer (smc: SubmodelElementLike | undefined): ManufacturerInformation | null {
  if (!smc) {
    return null
  }
  return {
    name: text(smc, 'ManufacturerName'),
    productDesignation: text(smc, 'ManufacturerProductDesignation'),
    orderCode: text(smc, 'OrderCodeOfManufacturer'),
    articleNumber: text(smc, 'ProductArticleNumberOfManufacturer'),
  }
}

function parseMaterial (smc: SubmodelElementLike | undefined): Material | null {
  if (!smc) {
    return null
  }
  const range = child(smc, 'MaterialCharacteristics')
  const min = range?.min === undefined || range?.min === null ? '' : String(range.min)
  const max = range?.max === undefined || range?.max === null ? '' : String(range.max)
  const masses = child(smc, 'Masses')

  return {
    name: text(smc, 'MaterialName'),
    manufacturer: text(smc, 'MaterialManufacturer'),
    characteristics: min || max ? { min, max } : null,
    totalMassPerUnit: text(masses, 'TotalMassPerUnit'),
    combustibleMassPerUnit: text(masses, 'CombustibleMassPerUnit'),
    massUnit: text(masses, 'Unit'),
    testedCombination: text(smc, 'TestedMaterialCombinationDescription'),
  }
}

function parseTest (test: SubmodelElementLike, index: number): FireTest {
  return {
    key: `${index}-${test.idShort ?? ''}`,
    idShort: test.idShort ?? '',
    procedure: text(test, 'TestProcedure'),
    result: text(test, 'TestResult'),
    date: text(test, 'TestDate'),
    comment: text(test, 'TestComment'),
    reportNumber: text(test, 'TestReportNumber'),
  }
}

function parseLab (smc: SubmodelElementLike | undefined): LabInformation | null {
  if (!smc) {
    return null
  }
  const address = child(smc, 'LabAddress') ?? null
  return {
    name: text(smc, 'LabName'),
    accreditation: text(smc, 'LabAccreditation'),
    author: text(smc, 'ReportAuthor'),
    address,
    email: text(child(address, 'Email'), 'EmailAddress'),
    phone: text(child(address, 'Phone'), 'TelephoneNumber'),
    website: text(address, 'AddressOfAdditionalLink'),
  }
}

function parseReport (report: SubmodelElementLike, index: number): FireReport {
  const tests = children(child(report, 'Tests')).map((test, i) => parseTest(test, i))
  const reportNumbers = [...new Set(tests.map(test => test.reportNumber).filter(Boolean))]

  return {
    key: `${index}-${report.idShort ?? ''}`,
    index,
    idShort: report.idShort ?? '',
    reportNumbers,
    file: nonEmptyFile(child(report, 'ReportFile')),
    comment: text(report, 'ReportComment'),
    tests,
    lab: parseLab(child(report, 'LabInformation')),
  }
}

function describeKeys (keys: Key[]): string {
  return keys.map(key => key.value ?? '').join(' › ')
}

/**
 * Follows the keys of a ModelReference through the submodel. Returns the target element and the elements passed
 * on the way to it, or the key that could not be followed.
 */
function followKeys (
  keys: Key[],
  submodel: SubmodelElementLike,
): { target: SubmodelElementLike | null, path: SubmodelElementLike[], failedKey: string, parentName: string } {
  let node: SubmodelElementLike | undefined = submodel
  const path: SubmodelElementLike[] = []

  for (const key of keys.slice(1)) {
    const parentName = node?.idShort ?? ''
    const value = key.value ?? ''
    const elements = children(node)

    node = node?.modelType === 'SubmodelElementList'
      ? (/^\d+$/.test(value) ? elements[Number(value)] : undefined)
      : elements.find(element => element.idShort === value)

    if (!node) {
      return { target: null, path, failedKey: value, parentName }
    }
    path.push(node)
  }

  return { target: node ?? null, path, failedKey: '', parentName: '' }
}

/**
 * Resolves one `ReportReference` to an entry of the `Reports` list.
 *
 * The exact key path is tried first. If it is broken (the IDTA 02102 v1.0 example uses `FCIL` instead of
 * `FireProtectionCertificates`), the key after `Reports` (otherwise the last key) is used: an index into `Reports`
 * or the idShort of a report.
 * A reference to an element inside a report, e.g. its `ReportFile`, resolves to that report.
 */
export function resolveReportLink (
  reference: SubmodelElementLike,
  submodel: SubmodelElementLike,
  reportElements: SubmodelElementLike[],
  index: number,
): ReportLink {
  const key = `${index}-${reference?.idShort ?? ''}`
  const keys: Key[] = Array.isArray(reference?.value?.keys) ? reference.value.keys : []
  const link: ReportLink = { key, status: 'unresolved', reportIndex: null, url: '', keys: describeKeys(keys), note: '' }

  if (keys.length === 0) {
    return { ...link, note: 'The reference is empty.' }
  }

  if (reference.value.type === 'ExternalReference' || keys[0].type === 'GlobalReference') {
    return { ...link, status: 'external', url: keys.at(-1)?.value ?? '' }
  }

  if (keys[0].type !== 'Submodel') {
    return { ...link, note: `The reference does not start with a Submodel key (${keys[0].type ?? 'no type'}).` }
  }

  const otherSubmodel = !!submodel.id && keys[0].value !== submodel.id
  const { target, path, failedKey, parentName } = followKeys(keys, submodel)
  // The report itself or the report that contains the target
  const reportElement = target ? path.findLast(element => reportElements.includes(element)) : undefined
  const exactIndex = reportElement ? reportElements.indexOf(reportElement) : -1

  if (exactIndex !== -1) {
    return otherSubmodel
      ? {
          ...link,
          status: 'repaired',
          reportIndex: exactIndex,
          note: `The reference names submodel “${keys[0].value}”; the report was found in this submodel.`,
        }
      : { ...link, status: 'resolved', reportIndex: exactIndex }
  }

  const reason = target
    ? 'The reference does not point to a report.'
    : `“${failedKey}” was not found in “${parentName}”.`

  // The key after `Reports` names the report (later keys may name an element inside it), otherwise the last key
  const reportsKey = keys.findIndex(k => /^Reports$/i.test(k.value ?? ''))
  const repairKey = keys[reportsKey === -1 ? keys.length - 1 : reportsKey + 1]?.value ?? keys.at(-1)?.value ?? ''
  let repairedIndex = /^\d+$/.test(repairKey) && Number(repairKey) < reportElements.length ? Number(repairKey) : -1
  if (repairedIndex === -1) {
    repairedIndex = reportElements.findIndex(report => report.idShort && report.idShort === repairKey)
  }

  if (repairedIndex !== -1) {
    return {
      ...link,
      status: 'repaired',
      reportIndex: repairedIndex,
      note: `${reason} Entry ${repairedIndex + 1} of “Reports” was used instead, based on the key “${repairKey}”.`,
    }
  }

  return { ...link, note: reason }
}

const REQUIREMENT_SET_CODE = /\bR\d+\b/

/** The EN 45545-2 requirement set code at the start of or inside a `Requirement` value, e.g. "R22"; '' if there is none */
export function requirementSetCode (requirement: string): string {
  return requirement.match(REQUIREMENT_SET_CODE)?.[0] ?? ''
}

function parseRequirementsSet (
  set: SubmodelElementLike,
  index: number,
  submodel: SubmodelElementLike,
  reportElements: SubmodelElementLike[],
): RequirementsSet {
  const hazardLevelElement = child(set, 'HazardLevel')
  const valueIds: string[] = Array.isArray(hazardLevelElement?.valueId?.keys)
    ? hazardLevelElement.valueId.keys.map((key: Key) => key.value ?? '')
    : []
  const references = children(child(set, 'ReportReferences'))
  const requirement = text(set, 'Requirement')
  const idShort = set.idShort ?? ''

  return {
    key: `${index}-${idShort}`,
    index,
    idShort,
    name: requirementSetCode(requirement) || idShort || `Set ${index + 1}`,
    requirement,
    hazardLevel: parseHazardLevel(textOf(hazardLevelElement), valueIds),
    reportLinks: references.map((reference, i) => resolveReportLink(reference, submodel, reportElements, i)),
  }
}

/** Parses a RailwayFireProtection (IDTA 02102 v1.0) submodel as returned by `setData` */
export function parseRailwayFireProtection (submodel: SubmodelElementLike | undefined | null): RailwayFireProtectionData {
  if (!submodel) {
    return { manufacturer: null, material: null, requirementsSets: [], reports: [] }
  }

  const certificates = child(submodel, 'FireProtectionCertificates')
  const reportElements = children(child(certificates, 'Reports'))

  return {
    manufacturer: parseManufacturer(child(submodel, 'ManufacturerInformation')),
    material: parseMaterial(child(submodel, 'Material')),
    requirementsSets: children(child(certificates, 'RequirementsSets'))
      .map((set, i) => parseRequirementsSet(set, i, submodel, reportElements)),
    reports: reportElements.map((report, i) => parseReport(report, i)),
  }
}

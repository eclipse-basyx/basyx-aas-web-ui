import type { SubmodelElementLike } from '../../shared/types'

/**
 * Hazard level values defined in IDTA 02102 (Table 6):
 * HL1–HL3 = "Compliant: Hazard Level 1–3", AFNR = "Approved Functional Necessity Report",
 * MTR = "Missing Test Results", NC = "Not Compliant"
 */
export type HazardLevelCode = 'HL1' | 'HL2' | 'HL3' | 'AFNR' | 'MTR' | 'NC' | 'unknown'

export interface HazardLevel {
  code: HazardLevelCode
  /** Value as stored in the submodel (surrounding quotes removed) */
  raw: string
}

export interface ManufacturerInformation {
  name: string
  productDesignation: string
  orderCode: string
  articleNumber: string
}

/** Lower and upper bound of a range, as stored in the submodel */
export interface ValueRange {
  min: string
  max: string
}

export interface Material {
  name: string
  manufacturer: string
  /** MaterialCharacteristics: normalized index (0–100) according to EN 45545-2 */
  characteristics: ValueRange | null
  totalMassPerUnit: string
  combustibleMassPerUnit: string
  massUnit: string
  testedCombination: string
}

export interface FireTest {
  key: string
  idShort: string
  procedure: string
  result: string
  date: string
  comment: string
  reportNumber: string
}

export interface LabInformation {
  name: string
  accreditation: string
  author: string
  /** The LabAddress SMC (drop-in of Contact Information 1.0), used to format the address */
  address: SubmodelElementLike | null
  email: string
  phone: string
  website: string
}

export interface FireReport {
  key: string
  /** Position in the `Reports` list */
  index: number
  idShort: string
  /** Report numbers of the contained tests, without duplicates */
  reportNumbers: string[]
  file: SubmodelElementLike | null
  comment: string
  tests: FireTest[]
  lab: LabInformation | null
}

/**
 * Result of resolving one `ReportReference`:
 * - `resolved`: the reference points exactly to a report of this submodel
 * - `repaired`: the key path is broken, but the report could be determined from its keys
 * - `external`: a GlobalReference (e.g. a URL to a report document)
 * - `unresolved`: the target could not be determined
 */
export type ReportLinkStatus = 'resolved' | 'repaired' | 'external' | 'unresolved'

export interface ReportLink {
  key: string
  status: ReportLinkStatus
  /** Index into `RailwayFireProtectionData.reports` for `resolved` and `repaired` links */
  reportIndex: number | null
  /** Target of an `external` link */
  url: string
  /** Human-readable key chain of the reference, e.g. "Submodel: … › FCIL › Reports › 0" */
  keys: string
  /** Why a link was repaired or could not be resolved */
  note: string
}

export interface RequirementsSet {
  key: string
  /** Position in the `RequirementsSets` list */
  index: number
  idShort: string
  /** Shown name: the requirement set code from the `Requirement` value (e.g. "R22"), otherwise the idShort or "Set N" */
  name: string
  requirement: string
  hazardLevel: HazardLevel
  reportLinks: ReportLink[]
}

export interface RailwayFireProtectionData {
  manufacturer: ManufacturerInformation | null
  material: Material | null
  requirementsSets: RequirementsSet[]
  reports: FireReport[]
}

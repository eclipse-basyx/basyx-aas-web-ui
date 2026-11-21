import type { FireReport, FireTest, HazardLevelCode, Material, RequirementsSet } from '../types'
import { HAZARD_LEVEL_ORDER } from './hazardLevel'

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

/**
 * Sorts requirement sets by name without changing the input: R1, R2, … R10, regardless of the submodel order.
 * Sets with the same name keep the order of the submodel.
 */
export function sortRequirementsSets (sets: RequirementsSet[]): RequirementsSet[] {
  return sets.toSorted((a, b) => collator.compare(a.name, b.name) || a.index - b.index)
}

/** Reports a requirement set links to, in link order; a report linked twice is listed once */
export function requirementsSetReports (set: RequirementsSet, reports: FireReport[]): FireReport[] {
  const reportIndexes = new Set<number>()
  for (const link of set.reportLinks) {
    if (link.reportIndex !== null && reports[link.reportIndex]) {
      reportIndexes.add(link.reportIndex)
    }
  }
  return [...reportIndexes].map(index => reports[index])
}

/** Tests of the reports a requirement set links to, in link order; a report linked twice is counted once */
export function requirementsSetTests (set: RequirementsSet, reports: FireReport[]): FireTest[] {
  return requirementsSetReports(set, reports).flatMap(report => report.tests)
}

/** Keeps the sets whose hazard level is selected; an empty selection keeps all */
export function filterRequirementsSets (sets: RequirementsSet[], codes: HazardLevelCode[]): RequirementsSet[] {
  return codes.length === 0 ? sets : sets.filter(set => codes.includes(set.hazardLevel.code))
}

/** Number of requirement sets per hazard level, in chip display order, without levels that do not occur */
export function countHazardLevels (sets: RequirementsSet[]): Array<{ code: HazardLevelCode, count: number }> {
  return HAZARD_LEVEL_ORDER
    .map(code => ({ code, count: sets.filter(set => set.hazardLevel.code === code).length }))
    .filter(entry => entry.count > 0)
}

export function fileName (path: string | undefined): string {
  if (!path) {
    return ''
  }
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? ''
  try {
    return decodeURIComponent(withoutQuery.split('/').pop() ?? '')
  } catch {
    return withoutQuery.split('/').pop() ?? ''
  }
}

/** e.g. "Report 2024-1176", otherwise the file name or "Report 1" */
export function reportTitle (report: FireReport): string {
  if (report.reportNumbers.length > 0) {
    return `Report ${report.reportNumbers.join(', ')}`
  }
  return fileName(report.file?.value) || `Report ${report.index + 1}`
}

/** Adds `https://` to bare host names such as `www.example.com`; returns '' for values that are not web addresses */
export function websiteUrl (value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return /^[\w-]+(?:\.[\w-]+)+(?:\/\S*)?$/.test(trimmed) ? `https://${trimmed}` : ''
}

/** Range of the MaterialCharacteristics index, collapsed to one value if min and max are equal */
export function characteristicsLabel (material: Material | null): string {
  const range = material?.characteristics
  if (!range) {
    return ''
  }
  if (!range.min || !range.max || range.min === range.max) {
    return range.min || range.max
  }
  return `${range.min} – ${range.max}`
}

/**
 * Share of the combustible mass in the total mass, between 0 and 1.
 * `null` if a mass is missing or not a number, or the total is 0; `invalid` if the combustible mass exceeds the total.
 */
export function combustibleShare (material: Material | null): number | 'invalid' | null {
  const total = parseDecimal(material?.totalMassPerUnit ?? '')
  const combustible = parseDecimal(material?.combustibleMassPerUnit ?? '')
  if (total === null || combustible === null || total <= 0 || combustible < 0) {
    return null
  }
  return combustible > total ? 'invalid' : combustible / total
}

/** Reads "12.324" or "0,35"; returns null for anything that is not a plain decimal number */
export function parseDecimal (value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : null
}

/** e.g. "0.35 kg/m²" */
export function withUnit (value: string, unit: string): string {
  return value ? [value, unit].filter(Boolean).join(' ') : ''
}

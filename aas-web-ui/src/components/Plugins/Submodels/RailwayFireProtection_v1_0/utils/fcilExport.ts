import type { FireReport, FireTest, HazardLevel, RailwayFireProtectionData } from '../types'
import { type FcilCatalogue, productCategoryCandidates, readFcilCatalogue } from './fcilClassification'
import { hazardLevelMeta } from './hazardLevel'
import { characteristicsLabel, parseDecimal, requirementsSetReports, sortRequirementsSets } from './presentation'
import {
  cellFill,
  type CellValue,
  clearFormulaResults,
  columnName,
  columnNumber,
  openXlsx,
  setCell,
  sheetTexts,
  worksheet,
  xlsxBytes,
  type XlsxPackage,
} from './xlsxTemplate'

/**
 * Export to the UNIFE "Fire Certificate Inventory List" template (TGFS.06, revision 06, English),
 * https://www.unife.org/activities/standards-and-regulation/firesafetylist/. The template is not part of
 * the application (UNIFE's terms of use do not allow redistributing it); the user selects a downloaded copy.
 *
 * The sheet "FCIL" gets one row per requirement set, with up to six tests; further tests continue in
 * the next row. The hazard level values of IDTA 02102 are the ones the template offers in "Hazard Level Met";
 * an unknown value stays out of that list column and goes to "Comments / Remarks".
 *
 * Only the input cells of the template (yellow) are filled in. The grey columns, such as the requirement
 * set and the test reference numbers, are looked up by the template from the product category; until
 * they are filled, the requirement set and the test procedures are listed under "Comments / Remarks".
 * The product category (AK) is filled in if the tests leave exactly one, see fcilClassification;
 * otherwise "Comments / Remarks" lists the candidates, or says why there are none.
 */

/** Cells to fill in, by column name (e.g. "AP") */
export type FcilRow = Record<string, CellValue>

interface TestOfReport { test: FireTest, report: FireReport }

const FCIL_SHEET = 'FCIL'
const COVER_SHEET = 'Cover Sheet'
/** Rows prepared by the template, filled with sample product categories in column AK */
const FIRST_ROW = 11
const LAST_ROW = 481
const TESTS_PER_ROW = 6
/**
 * Input columns of test method 1; each test method takes the next six columns. Its first two columns,
 * test reference number and requirement, are looked up by the template.
 */
const TEST_COLUMNS = { result: 'AP', laboratory: 'AQ', reportNumber: 'AR', date: 'AS' }
/** Fills of the template's input cells, light yellow: as RGB in "FCIL", as legacy palette colour on the "Cover Sheet" */
const INPUT_FILLS = new Set(['rgb:FFFFFF99', 'indexed:43'])

/** The requirement sets need more rows than the template prepares; the template itself is fine */
export class FcilRowLimitError extends Error {
  constructor (rows: number) {
    super(`These requirement sets need ${rows} rows, but the FCIL template has only ${LAST_ROW - FIRST_ROW + 1} (rows ${FIRST_ROW} to ${LAST_ROW}).`)
    this.name = 'FcilRowLimitError'
  }
}

/**
 * The template filled with the submodel data, as XLSX file; fails if `template` is no FCIL template of this layout,
 * or with `FcilRowLimitError` if the rows do not fit
 */
export function fillFcilTemplate (template: Uint8Array, data: RailwayFireProtectionData): Uint8Array {
  const xlsx = openFcilTemplate(template)
  const rows = fcilRows(data, readFcilCatalogue(xlsx))
  if (FIRST_ROW + rows.length - 1 > LAST_ROW) {
    throw new FcilRowLimitError(rows.length)
  }

  const cover = worksheet(xlsx, COVER_SHEET)
  setInputCell(xlsx, cover, 'K27', data.manufacturer?.productDesignation ?? '')
  setInputCell(xlsx, cover, 'F36', data.manufacturer?.name ?? '')

  const fcil = worksheet(xlsx, FCIL_SHEET)
  // Hazard level of the vehicle: chosen by the customer, not part of the submodel
  setInputCell(xlsx, fcil, 'O6', null)
  for (let row = FIRST_ROW; row <= LAST_ROW; row++) {
    setInputCell(xlsx, fcil, `AK${row}`, null)
  }
  for (const [index, row] of rows.entries()) {
    for (const [column, value] of Object.entries(row)) {
      setInputCell(xlsx, fcil, `${column}${FIRST_ROW + index}`, value)
    }
  }
  clearFormulaResults(fcil, FIRST_ROW)

  return xlsxBytes(xlsx)
}

/** The FCIL rows of the requirement sets, ordered by name as in the visualization */
export function fcilRows (data: RailwayFireProtectionData, catalogue: FcilCatalogue): FcilRow[] {
  const product = productColumns(data)

  return sortRequirementsSets(data.requirementsSets).flatMap(set => {
    const reports = requirementsSetReports(set, data.reports)
    const tests = reports.flatMap(report => report.tests.map(test => ({ test, report })))
    const reportRemarks = [
      ...new Set(reports.map(report => report.comment.trim()).filter(Boolean)),
      ...set.reportLinks.filter(link => link.status === 'external' && link.url).map(link => `Report: ${link.url}`),
    ]
    const categories = productCategoryCandidates(
      catalogue,
      set.name,
      hazardLevelMeta(set.hazardLevel.code).level,
      tests.map(({ test }) => test.procedure),
    )

    const chunks: TestOfReport[][] = []
    for (let start = 0; start < Math.max(tests.length, 1); start += TESTS_PER_ROW) {
      chunks.push(tests.slice(start, start + TESTS_PER_ROW))
    }

    return chunks.map((chunk, index) => {
      const first = index * TESTS_PER_ROW + 1
      const remarks = [
        index === 0
          ? `Requirement set ${set.name}`
          : `Requirement set ${set.name}, tests ${first}–${first + chunk.length - 1}, continued from the row above`,
        ...chunk.map(({ test }, position) => `Test method ${position + 1}: ${test.procedure}`),
        ...(index === 0
          ? [...categoryRemarks(categories, tests.length > 0), ...hazardLevelRemarks(set.hazardLevel), ...reportRemarks]
          : []),
      ]
      return {
        ...product,
        ...(index === 0 && categories?.length === 1 ? { AK: categories[0] } : {}),
        ...testColumns(chunk),
        // The IDTA 02102 value, which is also an entry of the template's list; the list allows no other value
        BY: set.hazardLevel.code === 'unknown' ? '' : hazardLevelMeta(set.hazardLevel.code).label,
        CA: remarks.join('\n'),
      }
    })
  })
}

/** e.g. "FCIL Example power socket module.xlsx" */
export function fcilFileName (data: RailwayFireProtectionData): string {
  const name = data.manufacturer?.productDesignation || data.material?.name || 'Railway Fire Protection'
  return `FCIL ${name.replaceAll(/[\\/:*?"<>|]+/g, '_').trim()}.xlsx`
}

/** Product and material, the same in every row */
function productColumns (data: RailwayFireProtectionData): FcilRow {
  const { manufacturer, material } = data
  const unit = material?.massUnit ?? ''
  const total = material?.totalMassPerUnit ?? ''
  const combustible = material?.combustibleMassPerUnit ?? ''

  return {
    N: manufacturer?.articleNumber || manufacturer?.orderCode || '',
    P: manufacturer?.productDesignation ?? '',
    Q: material?.name ?? '',
    R: material?.manufacturer ?? '',
    S: characteristicsLabel(material),
    // Numbers, so that the template can calculate the combustible mass per product
    T: parseDecimal(total) ?? total,
    U: total ? unit : '',
    V: parseDecimal(combustible) ?? combustible,
    W: combustible ? unit : '',
    // The submodel describes one product, so the template's combustible mass per product equals the mass per unit
    X: 1,
    AJ: material?.testedCombination ?? '',
  }
}

function testColumns (tests: TestOfReport[]): FcilRow {
  const row: FcilRow = {}
  for (const [index, { test, report }] of tests.entries()) {
    const column = (first: string) => columnName(columnNumber(first) + index * TESTS_PER_ROW)
    row[column(TEST_COLUMNS.result)] = test.result
    row[column(TEST_COLUMNS.laboratory)] = report.lab?.name ?? ''
    row[column(TEST_COLUMNS.reportNumber)] = test.reportNumber || report.reportNumbers.join(', ')
    row[column(TEST_COLUMNS.date)] = templateDate(test.date)
  }
  return row
}

/** The template, checked for document number and revision; the cell layout differs between revisions and languages */
function openFcilTemplate (template: Uint8Array): XlsxPackage {
  const wrongFile = new Error('The file is not the English UNIFE FCIL template TGFS.06, revision 06.')
  try {
    const xlsx = openXlsx(template)
    const cover = sheetTexts(xlsx, worksheet(xlsx, COVER_SHEET))
    if (cover.get('M5')?.includes('TGFS.06') && cover.get('M6')?.trim().startsWith('Revision: 06')) {
      return xlsx
    }
  } catch {
    // Not a ZIP file, no workbook or no cover sheet
  }
  throw wrongFile
}

/** Candidates for the product category if the tests do not leave exactly one, or why there are none */
function categoryRemarks (categories: string[] | null, tested: boolean): string[] {
  if (categories === null) {
    return tested ? ['Product category (column AK): none of the test procedures names a known EN 45545-2 test method'] : []
  }
  if (categories.length === 1) {
    return []
  }
  if (categories.length === 0) {
    return ['Product category (column AK): none of the template fits these tests']
  }
  return [`Product category (column AK), candidates by the tests: ${categories.map(name => name.trim()).join('; ')}`]
}

/** The stored value of a hazard level that is no IDTA 02102 value, and so no entry of the template's list in BY */
function hazardLevelRemarks ({ code, raw }: HazardLevel): string[] {
  return code === 'unknown' && raw.trim() ? [`Hazard level (column BY), not an IDTA 02102 value: ${raw.trim()}`] : []
}

/** Fills in a cell, or fails if it is no input cell (yellow) of the template */
function setInputCell (xlsx: XlsxPackage, sheet: Document, reference: string, value: CellValue): void {
  if (!INPUT_FILLS.has(cellFill(xlsx, sheet, reference))) {
    throw new Error(`Cell ${reference} is no input cell of the FCIL template.`)
  }
  setCell(sheet, reference, value)
}

/** The template asks for dd/mm/yyyy; other values are kept as they are */
function templateDate (value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

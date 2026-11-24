import type {
  FireReport,
  FireTest,
  RailwayFireProtectionData,
  RequirementsSet,
} from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/types'
import { strFromU8, unzipSync, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import {
  productCategoryCandidates,
  readFcilCatalogue,
  testMethods,
} from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/utils/fcilClassification'
import {
  fcilFileName,
  fcilRows,
  fillFcilTemplate,
} from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/utils/fcilExport'
import {
  cellFill,
  columnName,
  columnNumber,
  openXlsx,
  setCell,
  shiftFormula,
  worksheet,
  xlsxBytes,
} from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/utils/xlsxTemplate'
import { downloadFcilTemplate } from '../../../helpers/unifeTemplates'

// UNIFE FCIL template, loaded from unife.org (not redistributable, so not in the repository); skipped when offline
const template = await downloadFcilTemplate()
const catalogue = template ? readFcilCatalogue(openXlsx(template.slice())) : undefined

/** A fresh copy of the template */
function templateBytes (): Uint8Array {
  return template!.slice()
}

function test (procedure: string, result: string, date = '2026-03-17'): FireTest {
  return { key: procedure, idShort: 'Test', procedure, result, date, comment: '', reportNumber: 'TR-1' }
}

function report (index: number, tests: FireTest[], comment = ''): FireReport {
  return {
    key: `report-${index}`,
    index,
    idShort: `Report__0${index}__`,
    reportNumbers: ['TR-1'],
    file: null,
    comment,
    tests,
    lab: { name: 'Fire Lab', accreditation: '', author: '', address: null, email: '', phone: '', website: '' },
  }
}

function requirementsSet (index: number, name: string, raw: string, reportIndex: number | null): RequirementsSet {
  return {
    key: `set-${index}`,
    index,
    idShort: `RequirementsSet__0${index}__`,
    name,
    requirement: `${name} requirement`,
    hazardLevel: { code: raw.endsWith('1') ? 'HL1' : (raw.endsWith('3') ? 'HL3' : 'unknown'), raw },
    reportLinks: reportIndex === null
      ? []
      : [{ key: 'link', status: 'resolved', reportIndex, url: '', keys: '', note: '' }],
  }
}

function sampleData (): RailwayFireProtectionData {
  const manyTests = Array.from({ length: 8 }, (_, index) => test(`EN ${index + 1}`, String(index)))
  return {
    manufacturer: {
      name: 'Example Rail Components GmbH',
      productDesignation: 'Example power socket module',
      orderCode: 'EX-ORDER-001',
      articleNumber: 'EX-ARTICLE-001',
    },
    material: {
      name: 'Example compound',
      manufacturer: 'Example Compounds GmbH',
      characteristics: { min: '70', max: '85' },
      totalMassPerUnit: '12.324',
      combustibleMassPerUnit: '1,543',
      massUnit: 'kg',
      testedCombination: 'housing and cover plate',
    },
    requirementsSets: [
      requirementsSet(0, 'R24', 'Compliant: Hazard Level 1', 0),
      requirementsSet(1, 'R10', 'Compliant: Hazard Level 3', 1),
      requirementsSet(2, 'R26', 'something else', null),
      requirementsSet(3, 'R5', 'Compliant: Hazard Level 1', null),
      requirementsSet(4, 'R25', 'Compliant: Hazard Level 1', 2),
    ],
    reports: [
      report(0, [test('EN ISO 4589-2', '33')], 'R24 fulfilled'),
      report(1, manyTests),
      report(2, [test('EN 60695-2-11', '960')]),
    ],
  }
}

/** Text and formula of the cells of a worksheet in the generated file */
function readSheet (files: Record<string, Uint8Array>, path: string) {
  const sheet = new DOMParser().parseFromString(strFromU8(files[path]!), 'application/xml')
  const namespace = sheet.documentElement.namespaceURI
  const cells = new Map([...sheet.getElementsByTagNameNS(namespace, 'c')].map(cell => [cell.getAttribute('r'), cell]))
  return (reference: string) => {
    const cell = cells.get(reference)
    return {
      text: cell?.getElementsByTagNameNS(namespace, cell.getAttribute('t') === 'inlineStr' ? 't' : 'v')[0]?.textContent,
      formula: cell?.getElementsByTagNameNS(namespace, 'f')[0]?.textContent ?? '',
    }
  }
}

describe('xlsxTemplate', () => {
  it('converts column names and numbers', () => {
    expect(columnNumber('A')).toBe(1)
    expect(columnNumber('AN')).toBe(40)
    expect(columnName(40)).toBe('AN')
    expect(columnName(columnNumber('CB'))).toBe('CB')
  })

  it('moves relative references of a formula, but not absolute ones, names or text', () => {
    expect(shiftFormula('IF(V11="",T11*X11,V11*X11)', 2, 0)).toBe('IF(V13="",T13*X13,V13*X13)')
    expect(shiftFormula('IF(HL="HL1",HL1Set,$A$1+A$1+$A1)', 1, 1)).toBe('IF(HL="HL1",HL1Set,$A$1+B$1+$A2)')
    expect(shiftFormula('SUM(B11:B481)&"A1"&\'Sheet A1\'!C3', 1, 0)).toBe('SUM(B12:B482)&"A1"&\'Sheet A1\'!C4')
  })

  it.skipIf(!template)('reads the fill of a cell', () => {
    const xlsx = openXlsx(templateBytes())
    expect(cellFill(xlsx, worksheet(xlsx, 'FCIL'), 'AP11')).toBe('rgb:FFFFFF99')
    expect(cellFill(xlsx, worksheet(xlsx, 'FCIL'), 'AM11')).toBe('rgb:FFE4DFEC')
    expect(cellFill(xlsx, worksheet(xlsx, 'Cover Sheet'), 'K27')).toBe('indexed:43')
  })

  it.skipIf(!template)('writes out a shared formula into the other cells before overwriting the cell holding its text', () => {
    const xlsx = openXlsx(templateBytes())
    // AN14 holds the text of the formula shared down to AN48
    setCell(worksheet(xlsx, 'FCIL'), 'AN14', 'T01')
    const fcil = readSheet(unzipSync(xlsxBytes(xlsx)), 'xl/worksheets/sheet3.xml')
    expect(fcil('AN14')).toEqual({ text: 'T01', formula: '' })
    expect(fcil('AN20').formula).toBe('IF(ISBLANK(AK20),"",VLOOKUP(AM20,IF(HL="HL1",HL1Set,IF(HL="HL2",HL2Set,HL3Set)),2,FALSE))')
  })
})

describe('fcilClassification', () => {
  it('takes the test method from the procedure, or from its test standard', () => {
    expect(testMethods('DIN EN ISO 5659-2; T10.03')).toEqual(['T10.03'])
    expect(testMethods('EN ISO 9239-1')).toEqual(['T04'])
    expect(testMethods('EN 17084')).toEqual(['T11.01', 'T11.02', 'T12'])
    expect(testMethods('EN 60695-11-10')).toEqual(['T17'])
    expect(testMethods('ISO 15659-2')).toEqual([])
  })

  it.skipIf(!catalogue)('reads required, conditional and alternative test methods from the template', () => {
    expect(catalogue!.requirementSets.get('R10')?.get(3)).toEqual({ required: [['T04'], ['T10.03'], ['T11.02']], optional: [] })
    // HL1: no MARHE limit ("Marhe: -") and T05 only under Table 5, note a
    expect(catalogue!.requirementSets.get('R1')?.get(1)?.optional).toEqual(['T03.01', 'T05'])
    expect(catalogue!.requirementSets.get('Clause 4.2k)')?.get(1)?.required).toEqual([['T02', 'T04']])
    expect(catalogue!.productCategories).toHaveLength(113)
  })

  it.skipIf(!catalogue)('finds the product categories that fit the tests of the IDTA 02102 example', () => {
    const floor = ['EN ISO 9239-1', 'EN ISO 5659-2', 'EN 17084']
    expect(productCategoryCandidates(catalogue!, 'R10', 3, floor)).toEqual([
      'IN1C - Interior horizontal upwards facing surfaces',
      'IN15 - Floor composites',
    ])
    // Without the requirement set of the submodel, R28 fits the same tests
    expect(productCategoryCandidates(catalogue!, '', 3, floor)).toHaveLength(4)
    expect(productCategoryCandidates(catalogue!, 'R26', 2, ['EN 60695-11-10'])).toEqual([
      'EL9 - Printed circuit boards (R26) [EN 45545-2:2020]',
      'EL10 - Small electrotechnical products',
    ])
    expect(productCategoryCandidates(catalogue!, 'R25', 1, ['EN 60695-2-11'])).toEqual(['EL9 - Printed circuit boards (R25)'])
  })

  it.skipIf(!catalogue)('finds none if a required test is missing, and has no result without a known test', () => {
    expect(productCategoryCandidates(catalogue!, 'R10', 3, ['EN ISO 9239-1'])).toEqual([])
    expect(productCategoryCandidates(catalogue!, 'R10', 3, ['Customer test 42'])).toBeNull()
  })
})

describe.skipIf(!catalogue)('fcilRows', () => {
  const rows = catalogue ? fcilRows(sampleData(), catalogue) : []

  it('writes one row per requirement set, ordered by name, and continues after six tests', () => {
    expect(rows.map(row => String(row.CA).split('\n', 1)[0])).toEqual([
      'Requirement set R5',
      'Requirement set R10',
      'Requirement set R10, tests 7–8, continued from the row above',
      'Requirement set R24',
      'Requirement set R25',
      'Requirement set R26',
    ])
    expect(rows[1]).toMatchObject({ AP: '0', BT: '5' })
    expect(rows[2]).toMatchObject({ AP: '6', AV: '7' })
    expect(rows[2]!.CA).toContain('Test method 2: EN 8')
  })

  it('fills in only input (yellow) cells of the template', () => {
    const xlsx = openXlsx(templateBytes())
    const fcil = worksheet(xlsx, 'FCIL')
    const columns = new Set(rows.flatMap(row => Object.keys(row)))
    expect([...columns].filter(column => cellFill(xlsx, fcil, `${column}11`) !== 'rgb:FFFFFF99')).toEqual([])
  })

  it('fills in product, material, test and hazard level columns', () => {
    expect(rows[3]).toMatchObject({
      N: 'EX-ARTICLE-001',
      P: 'Example power socket module',
      Q: 'Example compound',
      R: 'Example Compounds GmbH',
      S: '70 – 85',
      T: 12.324,
      U: 'kg',
      V: 1.543,
      W: 'kg',
      X: 1,
      AJ: 'housing and cover plate',
      AP: '33',
      AQ: 'Fire Lab',
      AR: 'TR-1',
      AS: '17/03/2026',
      BY: 'Compliant: Hazard Level 1',
      CA: [
        'Requirement set R24',
        'Test method 1: EN ISO 4589-2',
        'Product category (column AK), candidates by the tests: EL9 - Printed circuit boards (R24); Grouping Rule 2',
        'R24 fulfilled',
      ].join('\n'),
    })
  })

  it('keeps a requirement set without tests and an unknown hazard level as stored', () => {
    expect(rows[5]).toMatchObject({ BY: 'something else', CA: 'Requirement set R26' })
    expect(rows[5]!.AP).toBeUndefined()
  })

  it('says why the product category is missing if no test procedure names a known test method', () => {
    expect(rows[1]!.AK).toBeUndefined()
    expect(rows[1]!.CA).toContain('Product category (column AK): none of the test procedures names a known EN 45545-2 test method')
  })

  it('fills in the product category only if the tests leave exactly one', () => {
    expect(rows[4]).toMatchObject({ AK: 'EL9 - Printed circuit boards (R25)', CA: 'Requirement set R25\nTest method 1: EN 60695-2-11' })
    expect(rows.filter(row => 'AK' in row)).toHaveLength(1)
  })

  it('derives the file name from the product', () => {
    expect(fcilFileName(sampleData())).toBe('FCIL Example power socket module.xlsx')
  })
})

describe('fillFcilTemplate with another file', () => {
  it('rejects a file that is not the FCIL template', () => {
    const message = 'The file is not the English UNIFE FCIL template TGFS.06, revision 06.'
    expect(() => fillFcilTemplate(new Uint8Array([1, 2, 3]), sampleData())).toThrow(message)
    expect(() => fillFcilTemplate(zipSync({ 'xl/workbook.xml': new Uint8Array() }), sampleData())).toThrow(message)
  })
})

describe.skipIf(!template)('fillFcilTemplate', () => {
  const files = template ? unzipSync(fillFcilTemplate(templateBytes(), sampleData())) : {}
  // Sheet parts of the template: "Cover Sheet" and "FCIL"
  const cover = readSheet(files, 'xl/worksheets/sheet2.xml')
  const fcil = readSheet(files, 'xl/worksheets/sheet3.xml')

  it('fills the cover sheet and the FCIL rows', () => {
    expect(cover('K27').text).toBe('Example power socket module')
    expect(cover('F36').text).toBe('Example Rail Components GmbH')
    expect(fcil('CA11').text).toBe('Requirement set R5')
    expect(fcil('AP14').text).toBe('33')
    expect(fcil('T14').text).toBe('12.324')
    expect(fcil('X14').text).toBe('1')
    expect(fcil('BY14').text).toBe('Compliant: Hazard Level 1')
    expect(fcil('AK15').text).toBe('EL9 - Printed circuit boards (R25)')
  })

  it('removes the sample product categories and the hazard level of the template', () => {
    expect(fcil('AK11').text).toBeUndefined()
    expect(fcil('AK100').text).toBeUndefined()
    expect(fcil('O6').text).toBeUndefined()
  })

  it('leaves the looked-up (grey) columns to the template, without stale results of the sample rows', () => {
    expect(fcil('Y11').formula).toBe('IF(V11="",T11*X11,V11*X11)')
    expect(fcil('AM11').formula).toBe('IF(ISBLANK(AK11),"",VLOOKUP(AK11,EN45545Table,3,FALSE))')
    expect(fcil('AM11').text).toBeUndefined()
    expect(fcil('AN11').text).toBeUndefined()
  })

  it('makes Excel recalculate and rebuild the calculation chain', () => {
    expect(files['xl/calcChain.xml']).toBeUndefined()
    expect(strFromU8(files['xl/workbook.xml']!)).toContain('fullCalcOnLoad="1"')
    expect(strFromU8(files['[Content_Types].xml']!)).not.toContain('calcChain')
    expect(strFromU8(files['xl/_rels/workbook.xml.rels']!)).not.toContain('calcChain')
  })
})

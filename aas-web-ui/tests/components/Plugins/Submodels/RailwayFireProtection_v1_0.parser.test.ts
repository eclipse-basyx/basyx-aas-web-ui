import type { FireReport, RequirementsSet } from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/types'
import { describe, expect, it } from 'vitest'
import { hazardLevelMeta, parseHazardLevel } from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/utils/hazardLevel'
import {
  parseRailwayFireProtection,
  requirementSetCode,
  resolveReportLink,
} from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/utils/parseRailwayFireProtection'
import {
  characteristicsLabel,
  combustibleShare,
  countHazardLevels,
  fileName,
  filterRequirementsSets,
  reportTitle,
  requirementsSetTests,
  sortRequirementsSets,
  websiteUrl,
} from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/utils/presentation'
import { stripQuotes } from '@/components/Plugins/Submodels/RailwayFireProtection_v1_0/utils/text'
import { loadIdtaExampleSubmodel, RAILWAY_FIRE_PROTECTION_EXAMPLE_URL } from '../../../helpers/idtaExamples'

// Official IDTA 02102 v1.0 example, loaded from admin-shell-io/submodel-templates (skipped when offline)
const officialExample = await loadIdtaExampleSubmodel(RAILWAY_FIRE_PROTECTION_EXAMPLE_URL, 'RailwayFireProtection')

const SUBMODEL_ID = 'urn:test:sm:railway-fire-protection'

function property (idShort: string, value: string) {
  return { idShort, modelType: 'Property', valueType: 'xs:string', value }
}

/** Minimal submodel with two reports, for the reference resolution */
function syntheticSubmodel (): any {
  return {
    id: SUBMODEL_ID,
    idShort: 'RailwayFireProtection',
    modelType: 'Submodel',
    submodelElements: [
      {
        idShort: 'FireProtectionCertificates',
        modelType: 'SubmodelElementCollection',
        value: [
          { idShort: 'RequirementsSets', modelType: 'SubmodelElementList', value: [] },
          {
            idShort: 'Reports',
            modelType: 'SubmodelElementList',
            value: [
              {
                idShort: 'ReportA',
                modelType: 'SubmodelElementCollection',
                value: [{ idShort: 'ReportFile', modelType: 'File', value: '/files/a.pdf', contentType: 'application/pdf' }],
              },
              { idShort: 'ReportB', modelType: 'SubmodelElementCollection', value: [] },
            ],
          },
        ],
      },
      { idShort: 'Material', modelType: 'SubmodelElementCollection', value: [property('MaterialName', 'Foam')] },
    ],
  }
}

function modelReference (...keys: Array<[string, string]>) {
  return {
    idShort: 'ReportReference',
    modelType: 'ReferenceElement',
    value: { type: 'ModelReference', keys: keys.map(([type, value]) => ({ type, value })) },
  }
}

function requirementsSet (idShort: string, index: number, hazardLevel: string): RequirementsSet {
  return {
    key: `${index}-${idShort}`,
    index,
    idShort,
    name: idShort,
    requirement: '',
    hazardLevel: parseHazardLevel(hazardLevel),
    reportLinks: [],
  }
}

describe.skipIf(!officialExample)('parseRailwayFireProtection with the official IDTA 02102 example', () => {
  const data = parseRailwayFireProtection(structuredClone(officialExample))

  it('parses manufacturer and material', () => {
    expect(data.manufacturer).toEqual({
      name: 'BIW Isolierstoffe GmbH',
      productDesignation: 'Silicone-Schaum RF035',
      orderCode: 'tbd',
      articleNumber: 'tbd',
    })
    expect(data.material).toMatchObject({
      name: 'Silicone-Schaum RF035',
      characteristics: { min: '25', max: '25' },
      totalMassPerUnit: '0.35',
      combustibleMassPerUnit: '0.36',
      massUnit: 'kg/m²',
    })
  })

  it('parses the requirement sets', () => {
    expect(data.requirementsSets.map(set => set.idShort)).toEqual(['R22', 'R23'])
    expect(data.requirementsSets.map(set => set.name)).toEqual(['R22', 'R23'])
    const [r22] = data.requirementsSets
    // Literal quotes in the example values are removed
    expect(r22.requirement).toBe('R22 requirement for hazard level HL3 according to EN 45545-2')
    expect(r22.hazardLevel).toEqual({ code: 'HL3', raw: 'Compliant: Hazard Level 3' })
  })

  it('resolves every report reference to the report', () => {
    // The example uses the key "FCIL" instead of "FireProtectionCertificates", which is repaired
    for (const set of data.requirementsSets) {
      expect(set.reportLinks).toHaveLength(1)
      expect(['resolved', 'repaired']).toContain(set.reportLinks[0].status)
      expect(set.reportLinks[0].reportIndex).toBe(0)
    }
  })

  it('parses the report with tests and laboratory', () => {
    expect(data.reports).toHaveLength(1)
    const [report] = data.reports
    expect(report.file?.value).toBe('/aasx/files/BIW_RF035_25MM_BRM_2024-1176_2024-06-06.PDF')
    expect(report.reportNumbers).toEqual(['2024-1176'])
    expect(report.tests.map(test => [test.procedure, test.result, test.date])).toEqual([
      ['DIN EN ISO 5659-2; T10.03', '74,0', '2024-06-06'],
      ['EN 17084 Verfahren 1; T11.02', '0,0477', '2024-06-06'],
    ])
    expect(report.lab).toMatchObject({
      name: 'Brandhaus Rhein-Main GmbH & Co. KG',
      author: 'Fire Testing Laboratory Certification Body',
      email: 'kontakt@brandhaus-RM.de',
      website: 'www.brandhaus-RM.de',
    })
    expect(report.lab?.accreditation).toMatch(/^accredited according to ISO\/IEC 17025/)
    expect(report.lab?.address?.idShort).toBe('LabAddress')
  })
})

describe('parseRailwayFireProtection', () => {
  it('returns empty data without a submodel or without requirement sets', () => {
    expect(parseRailwayFireProtection(undefined)).toEqual({
      manufacturer: null,
      material: null,
      requirementsSets: [],
      reports: [],
    })
    expect(parseRailwayFireProtection({ modelType: 'Submodel', submodelElements: [] }).requirementsSets).toEqual([])
  })

  it('names a requirement set by the R code in its Requirement value', () => {
    const sm = syntheticSubmodel()
    sm.submodelElements[0].value[0].value = [
      { idShort: 'RequirementsSet00', modelType: 'SubmodelElementCollection', value: [property('Requirement', '"R7 requirement for hazard level HL2 according to EN 45545-2"')] },
      { modelType: 'SubmodelElementCollection', value: [property('Requirement', 'Requirement set R24 (EN 45545-2)')] },
      { idShort: 'R11', modelType: 'SubmodelElementCollection', value: [property('Requirement', 'Interior surface, HL3')] },
      { modelType: 'SubmodelElementCollection', value: [] },
    ]
    expect(parseRailwayFireProtection(sm).requirementsSets.map(set => set.name)).toEqual(['R7', 'R24', 'R11', 'Set 4'])
  })
})

describe('requirementSetCode', () => {
  it('extracts the first R code and ignores other codes', () => {
    expect(requirementSetCode('R22 requirement for hazard level HL3 according to EN 45545-2')).toBe('R22')
    expect(requirementSetCode('According to EN 45545-2, R1 and R10')).toBe('R1')
    expect(requirementSetCode('HL3, EN 45545-2, PR22, R2a')).toBe('')
    expect(requirementSetCode('')).toBe('')
  })
})

describe('resolveReportLink', () => {
  const sm = syntheticSubmodel()
  const reports = sm.submodelElements[0].value[1].value

  it('resolves an exact model reference', () => {
    const reference = modelReference(
      ['Submodel', SUBMODEL_ID],
      ['SubmodelElementCollection', 'FireProtectionCertificates'],
      ['SubmodelElementList', 'Reports'],
      ['SubmodelElementCollection', '1'],
    )
    expect(resolveReportLink(reference, sm, reports, 0)).toMatchObject({ status: 'resolved', reportIndex: 1, note: '' })
  })

  it('resolves a reference to the file of a report to that report', () => {
    // As in the aas4j-submodels example: …/Reports/<index>/File:ReportFile
    const reference = modelReference(
      ['Submodel', SUBMODEL_ID],
      ['SubmodelElementCollection', 'FireProtectionCertificates'],
      ['SubmodelElementList', 'Reports'],
      ['SubmodelElementCollection', '0'],
      ['File', 'ReportFile'],
    )
    expect(resolveReportLink(reference, sm, reports, 0)).toMatchObject({ status: 'resolved', reportIndex: 0, note: '' })
  })

  it('repairs a broken key path from the key after Reports', () => {
    const reference = modelReference(
      ['Submodel', SUBMODEL_ID],
      ['SubmodelElementCollection', 'FCIL'],
      ['SubmodelElementList', 'Reports'],
      ['SubmodelElementCollection', '1'],
      ['File', 'ReportFile'],
    )
    const link = resolveReportLink(reference, sm, reports, 0)
    expect(link).toMatchObject({ status: 'repaired', reportIndex: 1 })
    expect(link.note).toContain('based on the key “1”')
  })

  it('repairs a broken key path from the list index in the last key', () => {
    const reference = modelReference(
      ['Submodel', SUBMODEL_ID],
      ['SubmodelElementCollection', 'FCIL'],
      ['SubmodelElementList', 'Reports'],
      ['SubmodelElementCollection', '0'],
    )
    const link = resolveReportLink(reference, sm, reports, 0)
    expect(link).toMatchObject({ status: 'repaired', reportIndex: 0 })
    expect(link.note).toContain('“FCIL” was not found')
  })

  it('marks a reference to another submodel id as repaired', () => {
    const reference = modelReference(
      ['Submodel', 'urn:other'],
      ['SubmodelElementCollection', 'FireProtectionCertificates'],
      ['SubmodelElementList', 'Reports'],
      ['SubmodelElementCollection', '0'],
    )
    expect(resolveReportLink(reference, sm, reports, 0)).toMatchObject({ status: 'repaired', reportIndex: 0 })
  })

  it('falls back to the idShort of a report in the last key', () => {
    const reference = modelReference(['Submodel', SUBMODEL_ID], ['SubmodelElementList', 'Reports'], ['SubmodelElementCollection', 'ReportB'])
    expect(resolveReportLink(reference, sm, reports, 0)).toMatchObject({ status: 'repaired', reportIndex: 1 })
  })

  it('leaves references unresolved that point nowhere', () => {
    const outOfRange = modelReference(['Submodel', SUBMODEL_ID], ['SubmodelElementCollection', 'FCIL'], ['SubmodelElementList', 'Reports'], ['SubmodelElementCollection', '7'])
    expect(resolveReportLink(outOfRange, sm, reports, 0)).toMatchObject({ status: 'unresolved', reportIndex: null })

    const notAReport = modelReference(['Submodel', SUBMODEL_ID], ['SubmodelElementCollection', 'Material'])
    expect(resolveReportLink(notAReport, sm, reports, 0)).toMatchObject({
      status: 'unresolved',
      note: 'The reference does not point to a report.',
    })

    expect(resolveReportLink({ idShort: 'Empty', value: null }, sm, reports, 0)).toMatchObject({ status: 'unresolved' })
  })

  it('treats external references as links', () => {
    const reference = {
      modelType: 'ReferenceElement',
      value: { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value: 'https://example.com/report.pdf' }] },
    }
    expect(resolveReportLink(reference, sm, reports, 0)).toMatchObject({
      status: 'external',
      url: 'https://example.com/report.pdf',
    })
  })
})

describe('parseHazardLevel', () => {
  it.each([
    ['Compliant: Hazard Level 1', 'HL1'],
    ['"Compliant: Hazard Level 2"', 'HL2'],
    ['compliant: hazard level 3', 'HL3'],
    ['HL3', 'HL3'],
    ['Approved Functional Necessity Report', 'AFNR'],
    ['Missing Test Results', 'MTR'],
    ['Not Compliant', 'NC'],
    ['Non-compliant', 'NC'],
    ['', 'unknown'],
    ['Hazard Level 4', 'unknown'],
  ])('maps %j to %s', (value, code) => {
    expect(parseHazardLevel(value).code).toBe(code)
  })

  it('prefers the valueId over the text', () => {
    expect(parseHazardLevel('Compliant: Hazard Level 3', ['https://admin-shell.io/idta/cds/HazardLevelValue/NC/1']).code).toBe('NC')
    // The specification spells the domain "adminshell.io"
    expect(parseHazardLevel('', ['https://adminshell.io/idta/cds/HazardLevelValue/AFNR/1']).code).toBe('AFNR')
  })

  it('provides display metadata', () => {
    expect(hazardLevelMeta('HL2')).toMatchObject({ short: 'HL2', color: 'success', level: 2 })
    expect(hazardLevelMeta('NC')).toMatchObject({ color: 'error', level: 0 })
  })
})

describe('presentation', () => {
  const sets = [
    requirementsSet('R10', 0, 'Compliant: Hazard Level 3'),
    requirementsSet('R2', 1, 'Not Compliant'),
    requirementsSet('R1', 2, 'Missing Test Results'),
    requirementsSet('R3', 3, 'Compliant: Hazard Level 1'),
  ]

  it('sorts requirement sets by their R code', () => {
    expect(sortRequirementsSets(sets).map(set => set.name)).toEqual(['R1', 'R2', 'R3', 'R10'])
    // The input is not changed
    expect(sets.map(set => set.idShort)).toEqual(['R10', 'R2', 'R1', 'R3'])
  })

  it('filters and counts by hazard level', () => {
    expect(filterRequirementsSets(sets, [])).toHaveLength(4)
    expect(filterRequirementsSets(sets, ['NC', 'MTR']).map(set => set.idShort)).toEqual(['R2', 'R1'])
    expect(countHazardLevels(sets)).toEqual([
      { code: 'HL3', count: 1 },
      { code: 'HL1', count: 1 },
      { code: 'MTR', count: 1 },
      { code: 'NC', count: 1 },
    ])
  })

  it('collects the tests of the linked reports', () => {
    const test = (procedure: string, result: string) =>
      ({ key: procedure, idShort: '', procedure, result, date: '', comment: '', reportNumber: '' })
    const report = (index: number, tests: ReturnType<typeof test>[]): FireReport =>
      ({ key: `${index}`, index, idShort: '', reportNumbers: [], file: null, comment: '', tests, lab: null })
    const link = (reportIndex: number | null) =>
      ({ key: `${reportIndex}`, status: reportIndex === null ? 'unresolved' as const : 'resolved' as const, reportIndex, url: '', keys: '', note: '' })
    const reports = [report(0, [test('T10.03', '74,0')]), report(1, [test('T11.02', '0,0477'), test('T12', '1')])]
    const set = { ...requirementsSet('R1', 0, 'Compliant: Hazard Level 3'), reportLinks: [link(1), link(0), link(1), link(null), link(5)] }

    expect(requirementsSetTests(set, reports).map(t => `${t.procedure}=${t.result}`)).toEqual(['T11.02=0,0477', 'T12=1', 'T10.03=74,0'])
    expect(requirementsSetTests(requirementsSet('R2', 1, ''), reports)).toEqual([])
  })

  it('computes the combustible share of the total mass', () => {
    const masses = (total: string, combustible: string) =>
      ({ totalMassPerUnit: total, combustibleMassPerUnit: combustible } as any)
    expect(combustibleShare(masses('12.324', '1.543'))).toBeCloseTo(0.1252, 4)
    expect(combustibleShare(masses('0,5', '0,25'))).toBe(0.5)
    expect(combustibleShare(masses('2', '0'))).toBe(0)
    // The official IDTA example lists more combustible mass than total mass
    expect(combustibleShare(masses('0.35', '0.36'))).toBe('invalid')
    expect(combustibleShare(masses('0', '0'))).toBeNull()
    expect(combustibleShare(masses('', '1'))).toBeNull()
    expect(combustibleShare(masses('approx. 3', '1'))).toBeNull()
    expect(combustibleShare(null)).toBeNull()
  })

  it('formats labels', () => {
    const report: FireReport = {
      key: '0-Report',
      index: 0,
      idShort: 'Report',
      reportNumbers: ['2024-1176'],
      file: { modelType: 'File', value: '/aasx/files/report%20one.pdf' },
      comment: '',
      tests: [],
      lab: null,
    }
    expect(reportTitle(report)).toBe('Report 2024-1176')
    expect(reportTitle({ ...report, reportNumbers: [] })).toBe('report one.pdf')
    expect(reportTitle({ ...report, reportNumbers: [], file: null, index: 2 })).toBe('Report 3')
    expect(fileName('https://example.com/a%20b.pdf?x=1')).toBe('a b.pdf')
    expect(websiteUrl('www.example.com')).toBe('https://www.example.com')
    expect(websiteUrl('not a url')).toBe('')
    expect(characteristicsLabel({ characteristics: { min: '25', max: '25' } } as any)).toBe('25')
    expect(characteristicsLabel({ characteristics: { min: '0', max: '100' } } as any)).toBe('0 – 100')
    expect(stripQuotes(' "quoted" ')).toBe('quoted')
  })
})

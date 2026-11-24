import { columnName, columnNumber, sheetTexts, worksheet, type XlsxPackage } from './xlsxTemplate'

/**
 * Product category of an FCIL row (column AK), derived from the tests of a requirement set:
 * test procedure → EN 45545-2 test method (e.g. T04) → requirement sets whose methods the tests
 * cover → the product categories the template assigns to those requirement sets.
 *
 * The requirement sets and product categories are read from the template ("Requirements" and
 * "EN45545 classifications"); only the test standard of each test method is not part of it.
 */

/** Test methods of a requirement set at one hazard level */
export interface MethodRequirements {
  /** Each entry is met by a test of one of its methods, e.g. ["T02", "T04"] for "T02/T04" */
  required: string[][]
  /** Methods that apply only under a condition, or without a limit at this hazard level */
  optional: string[]
}

export interface FcilCatalogue {
  /** Requirement set → hazard level (1–3) → test methods */
  requirementSets: Map<string, Map<number, MethodRequirements>>
  /** Entries of the product category list (column AK), with their requirement set */
  productCategories: Array<{ name: string, requirementSet: string }>
}

/**
 * Test standards of the test methods (EN 45545-2:2020 Table 4), by standard number. The template does not
 * contain them; they were compiled from memory and have not been checked against EN 45545-2 yet.
 * EN 45545-2:2013 Annex B (T06) has no number to match.
 */
const TEST_METHOD_STANDARDS: Array<[standardNumber: string, methods: string[]]> = [
  ['4589-2', ['T01']],
  ['5658-2', ['T02']],
  ['5660-1', ['T03.01', 'T03.02']],
  ['9239-1', ['T04']],
  ['11925-2', ['T05']],
  ['16989', ['T06.01', 'T06.02', 'T06.03']],
  ['12952-2', ['T07']],
  ['2592', ['T08']],
  ['60332-1-2', ['T09.01']],
  ['60332-3', ['T09.02', 'T09.03', 'T09.04']],
  ['50305', ['T09.02', 'T09.03', 'T09.04', 'T15']],
  ['5659-2', ['T10.01', 'T10.02', 'T10.03', 'T10.04']],
  ['17084', ['T11.01', 'T11.02', 'T12']],
  ['X70-100', ['T11.01', 'T11.02', 'T12']],
  ['61034-2', ['T13']],
  ['13501-1', ['T14']],
  ['60695-2-11', ['T16']],
  ['60695-11-10', ['T17']],
]

const METHOD_CODE = /\bT\d{2}(?:\.\d{2})?\b/g
/** A requirement without a limit, e.g. "CITG: -", "TSP ≤ -" or "Transmis.\n-" */
const NO_LIMIT = /(?:^|[:≤\n])\s*-\s*(?:$|\n)/

/**
 * Test methods a test procedure can stand for: the code if the procedure names one
 * (e.g. "DIN EN ISO 5659-2; T10.03"), otherwise all methods of its test standard
 */
export function testMethods (procedure: string): string[] {
  const codes = procedure.match(METHOD_CODE)
  if (codes) {
    return [...new Set(codes)]
  }
  return [...new Set(TEST_METHOD_STANDARDS
    .filter(([standardNumber]) => new RegExp(String.raw`(?<![\w-])${standardNumber}(?!\d)`, 'i').test(procedure))
    .flatMap(([, methods]) => methods))]
}

/** Requirement sets and product categories of the FCIL template */
export function readFcilCatalogue (xlsx: XlsxPackage): FcilCatalogue {
  const requirements = sheetTexts(xlsx, worksheet(xlsx, 'Requirements'))
  const requirementSets = new Map<string, Map<number, MethodRequirements>>()
  let level = 0
  for (let row = 1; row <= lastRow(requirements); row++) {
    const name = requirements.get(`A${row}`)?.trim() ?? ''
    const heading = /^HL([1-3])$/.exec(name)
    if (heading) {
      level = Number(heading[1])
      continue
    }
    if (level === 0 || name === '' || name === '_') {
      continue
    }
    // Pairs of columns: test reference (B, D, … L) and requirement (C, E, … M)
    const methods: MethodRequirements = { required: [], optional: [] }
    for (let column = columnNumber('B'); column <= columnNumber('L'); column += 2) {
      const reference = requirements.get(`${columnName(column)}${row}`) ?? ''
      const requirement = requirements.get(`${columnName(column + 1)}${row}`) ?? ''
      const codes = reference.match(METHOD_CODE) ?? []
      if (codes.length === 0) {
        continue
      }
      // "(T11.01)" and "(Table 5, note a) T05" apply only under a condition
      if (reference.trim().startsWith('(') || NO_LIMIT.test(requirement)) {
        methods.optional.push(...codes)
      } else {
        methods.required.push(codes)
      }
    }
    const byLevel = requirementSets.get(name) ?? new Map<number, MethodRequirements>()
    byLevel.set(level, methods)
    requirementSets.set(name, byLevel)
  }

  const classifications = sheetTexts(xlsx, worksheet(xlsx, 'EN45545 classifications'))
  const productCategories: FcilCatalogue['productCategories'] = []
  for (let row = 2; row <= lastRow(classifications); row++) {
    // Column A marks the categories offered in the list; the names are kept verbatim for the template's lookup
    const name = classifications.get(`B${row}`) ?? ''
    if (classifications.get(`A${row}`)?.trim() && name.trim()) {
      productCategories.push({ name, requirementSet: classifications.get(`D${row}`)?.trim() ?? '' })
    }
  }

  return { requirementSets, productCategories }
}

/**
 * Product categories that fit the tests: their requirement set requires no method without a test,
 * and each test belongs to it. Tests of an unknown method are left out; `null` if no test is left.
 * The requirement set named in the submodel narrows the result if the template knows it.
 */
export function productCategoryCandidates (
  catalogue: FcilCatalogue,
  requirementSet: string,
  hazardLevel: number,
  procedures: string[],
): string[] | null {
  const tests = procedures.map(procedure => testMethods(procedure)).filter(methods => methods.length > 0)
  if (tests.length === 0) {
    return null
  }
  const levels = hazardLevel >= 1 && hazardLevel <= 3 ? [hazardLevel] : [1, 2, 3]

  const fitting = [...catalogue.requirementSets]
    .filter(([, byLevel]) => levels.some(level => {
      const methods = byLevel.get(level)
      if (!methods || methods.required.length === 0) {
        return false
      }
      const known = new Set([...methods.required.flat(), ...methods.optional])
      return methods.required.every(group => tests.some(test => test.some(method => group.includes(method))))
        && tests.every(test => test.some(method => known.has(method)))
    }))
    .map(([name]) => name)
  const sets = catalogue.requirementSets.has(requirementSet)
    ? fitting.filter(name => name === requirementSet)
    : fitting

  return catalogue.productCategories
    .filter(category => sets.includes(category.requirementSet))
    .map(category => category.name)
}

function lastRow (texts: Map<string, string>): number {
  return Math.max(0, ...[...texts.keys()].map(reference => Number(reference.replace(/^[A-Z]+/, ''))))
}

import { strFromU8, strToU8, type Unzipped, unzipSync, zipSync } from 'fflate'

/**
 * Fills in cells of an existing XLSX file (e.g. a template) by editing its worksheet XML in place.
 * Everything else in the package (styles, drawings, data validation, other sheets) is kept as it is,
 * which a round trip through a spreadsheet library would not guarantee.
 */

// Namespace names are fixed identifiers, not addresses to load
/* eslint-disable unicorn/prefer-https */
const RELATIONSHIPS_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const XML_NS = 'http://www.w3.org/XML/1998/namespace'
/* eslint-enable unicorn/prefer-https */
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'

export type CellValue = string | number | null

export interface XlsxPackage {
  files: Unzipped
  /** Parsed XML parts by path; written back by `xlsxBytes` */
  documents: Map<string, Document>
}

interface CellAddress { column: number, row: number }

export function openXlsx (bytes: Uint8Array): XlsxPackage {
  return { files: unzipSync(bytes), documents: new Map() }
}

/** The worksheet with the given tab name */
export function worksheet (xlsx: XlsxPackage, name: string): Document {
  const workbook = xmlPart(xlsx, 'xl/workbook.xml')
  const sheet = elements(workbook, 'sheet').find(element => element.getAttribute('name') === name)
  const id = sheet?.getAttributeNS(RELATIONSHIPS_NS, 'id')
  const relationship = elements(xmlPart(xlsx, 'xl/_rels/workbook.xml.rels'), 'Relationship')
    .find(element => element.getAttribute('Id') === id)
  const target = relationship?.getAttribute('Target')
  if (!target) {
    throw new Error(`The workbook has no sheet “${name}”.`)
  }
  return xmlPart(xlsx, target.startsWith('/') ? target.slice(1) : `xl/${target}`)
}

/**
 * Sets a cell to a number or text, or clears it with `null` or ''; the cell keeps its style.
 * A formula in the cell is replaced; cells sharing that formula keep it.
 */
export function setCell (sheet: Document, reference: string, value: CellValue): void {
  const cell = cellElement(sheet, reference)
  detachSharedFormula(sheet, cell)
  cell.replaceChildren()
  cell.removeAttribute('t')

  if (value === null || value === '') {
    return
  }
  const namespace = sheet.documentElement.namespaceURI
  if (typeof value === 'number') {
    const number = sheet.createElementNS(namespace, 'v')
    number.textContent = String(value)
    cell.append(number)
    return
  }
  // Inline strings leave the shared string table untouched
  cell.setAttribute('t', 'inlineStr')
  const inline = sheet.createElementNS(namespace, 'is')
  const text = sheet.createElementNS(namespace, 't')
  text.setAttributeNS(XML_NS, 'xml:space', 'preserve')
  text.textContent = value
  inline.append(text)
  cell.append(inline)
}

/** The texts of all cells holding a value (shared or inline string, number, cached formula result), by reference */
export function sheetTexts (xlsx: XlsxPackage, sheet: Document): Map<string, string> {
  const sharedStrings = xlsx.files['xl/sharedStrings.xml']
    ? elements(xmlPart(xlsx, 'xl/sharedStrings.xml'), 'si').map(item => textOf(item))
    : []
  const texts = new Map<string, string>()
  for (const cell of elements(sheet, 'c')) {
    const reference = cell.getAttribute('r')
    const value = elements(cell, 'v')[0]?.textContent
    const type = cell.getAttribute('t')
    const text = type === 'inlineStr'
      ? textOf(cell)
      : (type === 's' && value !== undefined ? sharedStrings[Number(value)] : value)
    if (reference && text !== undefined && text !== null) {
      texts.set(reference, text)
    }
  }
  return texts
}

/**
 * The fill colour of a cell as `rgb:AARRGGBB`, `indexed:N` (legacy palette) or `theme:N`; '' without fill
 * or if the sheet has no such cell
 */
export function cellFill (xlsx: XlsxPackage, sheet: Document, reference: string): string {
  const cell = findCell(sheet, parseCellReference(reference))
  if (!cell) {
    return ''
  }
  const styles = xmlPart(xlsx, 'xl/styles.xml')
  const [cellFormats] = elements(styles, 'cellXfs')
  const [fills] = elements(styles, 'fills')
  const format = cellFormats ? elements(cellFormats, 'xf')[Number(cell.getAttribute('s') ?? 0)] : undefined
  const fill = fills ? elements(fills, 'fill')[Number(format?.getAttribute('fillId') ?? 0)] : undefined
  const pattern = fill ? elements(fill, 'patternFill')[0] : undefined
  const color = pattern && pattern.getAttribute('patternType') !== 'none' ? elements(pattern, 'fgColor')[0] : undefined
  const kind = ['rgb', 'indexed', 'theme'].find(attribute => color?.hasAttribute(attribute))
  return kind ? `${kind}:${color?.getAttribute(kind)?.toUpperCase()}` : ''
}

/**
 * Removes the cached results of the formulas from `fromRow` on, so that no viewer shows results
 * that no longer match the filled-in cells; Excel recalculates them on opening (see `xlsxBytes`).
 */
export function clearFormulaResults (sheet: Document, fromRow: number): void {
  for (const formula of elements(sheet, 'f')) {
    const cell = formula.parentElement
    if (cell && parseCellReference(cell.getAttribute('r') ?? '').row >= fromRow) {
      for (const value of elements(cell, 'v')) {
        value.remove()
      }
      cell.removeAttribute('t')
    }
  }
}

/**
 * The XLSX file with all changes. Excel recalculates every formula on opening, and the calculation
 * chain is dropped because it may list cells whose formula was replaced (Excel rebuilds it).
 */
export function xlsxBytes (xlsx: XlsxPackage): Uint8Array {
  const workbook = xmlPart(xlsx, 'xl/workbook.xml')
  const calcPr = elements(workbook, 'calcPr')[0]
  calcPr?.setAttribute('fullCalcOnLoad', '1')

  delete xlsx.files['xl/calcChain.xml']
  for (const relationship of elements(xmlPart(xlsx, 'xl/_rels/workbook.xml.rels'), 'Relationship')) {
    if (relationship.getAttribute('Type')?.endsWith('/calcChain')) {
      relationship.remove()
    }
  }
  for (const override of elements(xmlPart(xlsx, '[Content_Types].xml'), 'Override')) {
    if (override.getAttribute('PartName') === '/xl/calcChain.xml') {
      override.remove()
    }
  }

  const serializer = new XMLSerializer()
  for (const [path, document] of xlsx.documents) {
    const xml = serializer.serializeToString(document)
    xlsx.files[path] = strToU8(xml.startsWith('<?xml') ? xml : XML_DECLARATION + xml)
  }
  return zipSync(xlsx.files, { level: 6 })
}

/** Column number (A = 1) of a column name */
export function columnNumber (name: string): number {
  let number = 0
  for (const letter of name.toUpperCase()) {
    number = number * 26 + letter.codePointAt(0)! - 64
  }
  return number
}

/** Column name of a column number (1 = A) */
export function columnName (number: number): string {
  let name = ''
  for (let rest = number; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    name = String.fromCodePoint(65 + ((rest - 1) % 26)) + name
  }
  return name
}

/**
 * Moves the relative cell references of a formula by the given number of rows and columns,
 * as Excel does when it copies the formula; text in quotes and absolute ($) parts stay as they are.
 */
export function shiftFormula (formula: string, rows: number, columns: number): string {
  // Odd parts are quoted: "text" or 'sheet name'
  return formula.split(/("(?:[^"]|"")*"|'(?:[^']|'')*')/).map((part, index) => index % 2 === 1
    ? part
    : part.replace(
        /(^|[^\w.$])(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\w(.!])/g,
        (_match, before: string, columnLock: string, column: string, rowLock: string, row: string) => {
          const shiftedColumn = columnLock ? column : columnName(columnNumber(column) + columns)
          const shiftedRow = rowLock ? row : String(Number(row) + rows)
          return `${before}${columnLock}${shiftedColumn}${rowLock}${shiftedRow}`
        },
      ),
  ).join('')
}

function xmlPart (xlsx: XlsxPackage, path: string): Document {
  let document = xlsx.documents.get(path)
  if (!document) {
    const file = xlsx.files[path]
    if (!file) {
      throw new Error(`The file has no part “${path}”.`)
    }
    document = new DOMParser().parseFromString(strFromU8(file), 'application/xml')
    if (document.getElementsByTagNameNS('*', 'parsererror').length > 0) {
      throw new Error(`The part “${path}” is no valid XML.`)
    }
    xlsx.documents.set(path, document)
  }
  return document
}

/** Elements of the part's own namespace, e.g. `f` but not `xm:f` of an extension */
/** Text of the `t` elements below a string item or inline string, without phonetic runs */
function textOf (parent: Element): string {
  return elements(parent, 't')
    .filter(text => text.parentElement?.localName !== 'rPh')
    .map(text => text.textContent ?? '')
    .join('')
}

function elements (parent: Document | Element, localName: string): Element[] {
  const namespace = (parent.ownerDocument ?? parent as Document).documentElement.namespaceURI
  return [...parent.getElementsByTagNameNS(namespace, localName)]
}

function parseCellReference (reference: string): CellAddress {
  const match = /^([A-Z]+)(\d+)$/.exec(reference.toUpperCase())
  if (!match) {
    throw new Error(`“${reference}” is no cell reference.`)
  }
  return { column: columnNumber(match[1]), row: Number(match[2]) }
}

function findCell (sheet: Document, address: CellAddress): Element | undefined {
  const name = `${columnName(address.column)}${address.row}`
  const row = elements(sheet, 'row').find(element => Number(element.getAttribute('r')) === address.row)
  return row ? elements(row, 'c').find(element => element.getAttribute('r') === name) : undefined
}

/** The `c` element of a cell, created (in row and column order) if the sheet does not have it yet */
function cellElement (sheet: Document, reference: string): Element {
  const address = parseCellReference(reference)
  const namespace = sheet.documentElement.namespaceURI
  const sheetData = elements(sheet, 'sheetData')[0]
  if (!sheetData) {
    throw new Error('The worksheet has no cell data.')
  }

  const rows = elements(sheetData, 'row')
  let row = rows.find(element => Number(element.getAttribute('r')) === address.row)
  if (!row) {
    row = sheet.createElementNS(namespace, 'row')
    row.setAttribute('r', String(address.row))
    sheetData.insertBefore(row, rows.find(element => Number(element.getAttribute('r')) > address.row) ?? null)
  }

  const cells = elements(row, 'c')
  const name = `${columnName(address.column)}${address.row}`
  let cell = cells.find(element => element.getAttribute('r') === name)
  if (!cell) {
    cell = sheet.createElementNS(namespace, 'c')
    cell.setAttribute('r', name)
    row.insertBefore(cell, cells.find(element =>
      parseCellReference(element.getAttribute('r') ?? '').column > address.column) ?? null)
  }
  return cell
}

/**
 * The first cell of a shared formula holds its text, the others only refer to it. Before that first
 * cell is overwritten, the other cells get the formula written out, moved to their position.
 */
function detachSharedFormula (sheet: Document, cell: Element): void {
  const formula = elements(cell, 'f')[0]
  if (formula?.getAttribute('t') !== 'shared' || !formula.hasAttribute('ref')) {
    return
  }
  const id = formula.getAttribute('si')
  const origin = parseCellReference(cell.getAttribute('r') ?? '')
  for (const other of elements(sheet, 'f')) {
    if (other === formula || other.getAttribute('t') !== 'shared' || other.getAttribute('si') !== id) {
      continue
    }
    const target = parseCellReference(other.parentElement?.getAttribute('r') ?? '')
    other.textContent = shiftFormula(formula.textContent ?? '', target.row - origin.row, target.column - origin.column)
    other.removeAttribute('t')
    other.removeAttribute('si')
    other.removeAttribute('ref')
  }
}

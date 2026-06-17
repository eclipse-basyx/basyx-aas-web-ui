export interface PlantUmlBuildOptions {
  maxElements?: number
  maxTextLength?: number
}

export interface PlantUmlBuildResult {
  source: string
  warnings: string[]
  nodeCount: number
  truncated: boolean
}

type UnknownRecord = Record<string, unknown>

interface UmlClassNode {
  alias: string
  label: string
  stereotype: string
  attributes: string[]
}

interface UmlEdge {
  from: string
  to: string
  cardinality: string
}

interface ChildElement {
  element: UnknownRecord
  label?: string
}

const DEFAULT_MAX_ELEMENTS = 160
const DEFAULT_MAX_TEXT_LENGTH = 48
const MAX_CLASS_LABEL_LENGTH = 56
const MAX_MEMBER_NAME_LENGTH = 40
const MAX_MEMBER_TYPE_LENGTH = 32
const MAX_MEMBER_VALUE_LENGTH = 48

const classModelTypes = new Set([
  'Submodel',
  'SubmodelElementCollection',
  'SubmodelElementList',
  'Entity',
  'AnnotatedRelationshipElement',
  'Operation',
])

const leafValueModelTypes = new Set([
  'Property',
  'MultiLanguageProperty',
  'Range',
  'Blob',
  'File',
  'ReferenceElement',
  'RelationshipElement',
  'BasicEventElement',
  'Capability',
])

const cardinalityLabels: Record<string, string> = {
  One: '1',
  ZeroToOne: '0..1',
  ZeroToMany: '0..*',
  OneToMany: '1..*',
}

const modelTypeShorthands: Record<string, string> = {
  AnnotatedRelationshipElement: 'ARel',
  BasicEventElement: 'BEE',
  Blob: 'Blob',
  Capability: 'Cap',
  Entity: 'Entity',
  File: 'File',
  MultiLanguageProperty: 'MLP',
  Operation: 'Op',
  Property: 'Prop',
  Range: 'Range',
  ReferenceElement: 'Ref',
  RelationshipElement: 'Rel',
  Submodel: 'SM',
  SubmodelElementCollection: 'SMC',
  SubmodelElementList: 'SML',
}

export function buildPlantUmlForSubmodelElement (
  selectedNode: unknown,
  options: PlantUmlBuildOptions = {},
): PlantUmlBuildResult {
  const maxElements = options.maxElements ?? DEFAULT_MAX_ELEMENTS
  const warnings: string[] = []
  const classes: UmlClassNode[] = []
  const edges: UmlEdge[] = []

  let nodeCount = 0
  let aliasCounter = 0
  let truncated = false

  if (!isRecord(selectedNode) || Object.keys(selectedNode).length === 0) {
    warnings.push('No Submodel/SubmodelElement data available for UML export.')

    return {
      source: createPlantUmlSource([], [], warnings),
      warnings,
      nodeCount,
      truncated,
    }
  }

  visitAsClass(selectedNode)

  if (truncated) {
    warnings.push(`UML diagram was truncated after ${maxElements} elements.`)
  }

  return {
    source: createPlantUmlSource(classes, edges, warnings),
    warnings,
    nodeCount,
    truncated,
  }

  function reserveElement (): boolean {
    if (nodeCount >= maxElements) {
      truncated = true
      return false
    }

    nodeCount += 1
    return true
  }

  function visitAsClass (
    element: UnknownRecord,
    parentAlias?: string,
    relationLabel?: string,
  ): string | undefined {
    if (!reserveElement()) {
      return undefined
    }

    const alias = `C${aliasCounter++}`
    const classNode: UmlClassNode = {
      alias,
      label: formatClassLabel(relationLabel || displayName(element)),
      stereotype: modelTypeShorthand(modelTypeOf(element)),
      attributes: [],
    }

    if (!isClassElement(element)) {
      addAttribute(classNode, formatValueAttribute(element))
    }

    classes.push(classNode)

    if (parentAlias) {
      edges.push({
        from: parentAlias,
        to: alias,
        cardinality: cardinalityOf(element),
      })
    }

    for (const child of childElements(element)) {
      if (isClassElement(child.element)) {
        const childAlias = visitAsClass(child.element, alias, child.label)
        if (childAlias) {
          addAttribute(classNode, formatElementMember(child.element, child.label))
        }
      } else if (leafValueModelTypes.has(modelTypeOf(child.element)) && reserveElement()) {
        addAttribute(classNode, formatElementMember(child.element, child.label))
      }
    }

    return alias
  }

  function truncateText (value: string, maxLength = options.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH): string {
    if (value.length <= maxLength) {
      return value
    }

    return `${value.slice(0, Math.max(0, maxLength - 3))}...`
  }

  function boundedText (value: string, maxLength: number): string {
    return truncateText(value, Math.min(options.maxTextLength ?? maxLength, maxLength))
  }

  function addAttribute (classNode: UmlClassNode, attribute: string): void {
    const sanitized = sanitizeClassBodyText(attribute)
    if (!classNode.attributes.includes(sanitized)) {
      classNode.attributes.push(sanitized)
    }
  }

  function formatElementMember (element: UnknownRecord, label?: string): string {
    const rawName = label || displayName(element)
    const name = boundedText(sanitizeClassBodyText(rawName), MAX_MEMBER_NAME_LENGTH)
    const type = boundedText(
      isClassElement(element) ? modelTypeShorthand(modelTypeOf(element)) : leafValueType(element),
      MAX_MEMBER_TYPE_LENGTH,
    )
    const value = isClassElement(element) ? '' : valueAssignment(element)

    return sanitizeClassBodyText(`{field} + ${name}: ${type}${value}`)
  }

  function formatValueAttribute (element: UnknownRecord): string {
    return formatElementMember(element)
  }

  function formatClassLabel (label: string): string {
    return boundedText(sanitizeClassBodyText(label), MAX_CLASS_LABEL_LENGTH)
  }

  function valueAssignment (element: UnknownRecord): string {
    const value = elementValueText(element)
    if (!value) {
      return ''
    }

    return ` = ${boundedText(value, MAX_MEMBER_VALUE_LENGTH)}`
  }
}

function createPlantUmlSource (
  classes: UmlClassNode[],
  edges: UmlEdge[],
  warnings: string[],
): string {
  const lines = [
    '@startuml',
    '\' Generated by BaSyx AAS Web UI',
    'hide circle',
    'hide empty methods',
    'skinparam classAttributeIconSize 0',
    'skinparam shadowing false',
    'skinparam linetype ortho',
    'skinparam backgroundColor white',
    'skinparam classBackgroundColor white',
    'skinparam classBorderColor #2F3542',
    'skinparam classFontColor #111111',
    'skinparam classAttributeFontColor #111111',
    '',
  ]

  for (const warning of warnings) {
    lines.push(`' Warning: ${sanitizeCommentText(warning)}`)
  }

  if (warnings.length > 0) {
    lines.push('')
  }

  for (const classNode of classes) {
    const stereotype = classNode.stereotype ? ` <<${sanitizeStereotype(classNode.stereotype)}>>` : ''
    lines.push(`class "${escapeQuotedText(classNode.label)}" as ${classNode.alias}${stereotype} {`)
    for (const attribute of classNode.attributes) {
      lines.push(`  ${attribute}`)
    }
    lines.push('}', '')
  }

  for (const edge of edges) {
    const cardinality = edge.cardinality ? ` "${escapeQuotedText(edge.cardinality)}"` : ''
    lines.push(`${edge.from} *--${cardinality} ${edge.to}`)
  }

  if (classes.length === 0) {
    lines.push('class "No UML data" as Empty')
  }

  lines.push('@enduml')

  return lines.join('\n')
}

function childElements (element: UnknownRecord): ChildElement[] {
  const modelType = modelTypeOf(element)

  if (modelType === 'Submodel') {
    return arrayChildren(element.submodelElements)
  }

  if (modelType === 'SubmodelElementCollection') {
    return arrayChildren(element.value)
  }

  if (modelType === 'SubmodelElementList') {
    return indexedChildren(element.value)
  }

  if (modelType === 'Entity') {
    return arrayChildren(element.statements)
  }

  if (modelType === 'AnnotatedRelationshipElement') {
    return arrayChildren(element.annotations)
  }

  if (modelType === 'Operation') {
    return operationVariableChildren(element)
  }

  return []
}

function arrayChildren (value: unknown): ChildElement[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map(element => ({ element }))
}

function indexedChildren (value: unknown): ChildElement[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((element, index) => {
    if (!isRecord(element)) {
      return []
    }

    return [{
      element,
      label: formatListIndex(index),
    }]
  })
}

function formatListIndex (index: number): string {
  return `{${index.toString().padStart(2, '0')}}`
}

function operationVariableChildren (operation: UnknownRecord): ChildElement[] {
  return [
    ...operationVariables(operation.inputVariables, 'in'),
    ...operationVariables(operation.outputVariables, 'out'),
    ...operationVariables(operation.inoutputVariables, 'inout'),
  ]
}

function operationVariables (variables: unknown, direction: string): ChildElement[] {
  if (!Array.isArray(variables)) {
    return []
  }

  return variables.flatMap(variable => {
    if (!isRecord(variable) || !isRecord(variable.value)) {
      return []
    }

    return [{
      element: variable.value,
      label: `${direction} ${displayName(variable.value)}`,
    }]
  })
}

function isClassElement (element: UnknownRecord): boolean {
  return classModelTypes.has(modelTypeOf(element))
}

function modelTypeOf (element: UnknownRecord): string {
  return stringValue(element.modelType) || 'Referable'
}

function displayName (element: UnknownRecord): string {
  const idShort = stringValue(element.idShort)
  if (idShort) {
    return idShort
  }

  const semanticIdName = semanticIdConceptName(element.semanticId)
  if (semanticIdName) {
    return semanticIdName
  }

  const displayNameValue = langStringSetToText(element.displayName)
  if (displayNameValue) {
    return displayNameValue
  }

  return modelTypeOf(element)
}

function leafValueType (element: UnknownRecord): string {
  const valueType = stringValue(element.valueType)
  if (valueType) {
    return valueType
  }

  const contentType = stringValue(element.contentType)
  if (contentType) {
    return contentType
  }

  return modelTypeShorthand(modelTypeOf(element))
}

function elementValueText (element: UnknownRecord): string {
  if (modelTypeOf(element) === 'Range') {
    const min = primitiveValueToText(element.min)
    const max = primitiveValueToText(element.max)

    if (min || max) {
      return `${min || '*'}..${max || '*'}`
    }
  }

  if ('value' in element) {
    return valueToText(element.value)
  }

  return ''
}

function valueToText (value: unknown): string {
  if (Array.isArray(value)) {
    const langStringValue = langStringSetToText(value)
    if (langStringValue) {
      return langStringValue
    }

    return value.map(item => valueToText(item)).filter(Boolean).join(', ')
  }

  if (isRecord(value)) {
    const referenceText = referenceToText(value)
    if (referenceText) {
      return referenceText
    }

    try {
      return JSON.stringify(value) || ''
    } catch {
      return ''
    }
  }

  return primitiveValueToText(value)
}

function primitiveValueToText (value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString()
  }

  return ''
}

function referenceToText (value: UnknownRecord): string {
  if (!Array.isArray(value.keys)) {
    return ''
  }

  return value.keys
    .filter(isRecord)
    .map(key => stringValue(key.value))
    .filter(Boolean)
    .join(' / ')
}

function cardinalityOf (element: UnknownRecord): string {
  const qualifiers = Array.isArray(element.qualifiers) ? element.qualifiers : []

  for (const qualifier of qualifiers) {
    if (!isRecord(qualifier)) {
      continue
    }

    if (stringValue(qualifier.kind) !== 'ConceptQualifier') {
      continue
    }

    const type = stringValue(qualifier.type)
    const value = stringValue(qualifier.value)

    if ((type === 'SMT/Cardinality' || type === 'Multiplicity') && value && cardinalityLabels[value]) {
      return cardinalityLabels[value]
    }
  }

  return ''
}

function modelTypeShorthand (modelType: string): string {
  return modelTypeShorthands[modelType] || modelType
}

function semanticIdConceptName (semanticId: unknown): string {
  if (!isRecord(semanticId) || !Array.isArray(semanticId.keys)) {
    return ''
  }

  const lastKey = semanticId.keys.findLast(isRecord)
  const value = lastKey ? stringValue(lastKey.value) : ''

  if (!value || !value.includes('://')) {
    return ''
  }

  try {
    const url = new URL(value)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const conceptName = pathParts.findLast(part => !/^\d+$/.test(part))

    return conceptName || ''
  } catch {
    return ''
  }
}

function langStringSetToText (value: unknown): string {
  if (!Array.isArray(value)) {
    return ''
  }

  const langString = value.find(item => isRecord(item) && stringValue(item.language) === 'en') || value.find(isRecord)
  if (!isRecord(langString)) {
    return ''
  }

  const text = stringValue(langString.text)

  if (!text) {
    return ''
  }

  return text
}

function stringValue (value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeClassBodyText (value: string): string {
  const preservedListIndexes: string[] = []
  const preservedFieldMarkers: string[] = []
  const fieldMarkerSafeValue = value.replaceAll(/\{field\}/gi, match => {
    const placeholder = `__PUML_FIELD_MARKER_${preservedFieldMarkers.length}__`
    preservedFieldMarkers.push(match.toLowerCase())

    return placeholder
  })
  const listIndexSafeValue = fieldMarkerSafeValue.replaceAll(/\{\d{2}\}/g, match => {
    const placeholder = `__PUML_LIST_INDEX_${preservedListIndexes.length}__`
    preservedListIndexes.push(match)

    return placeholder
  })

  let sanitized = listIndexSafeValue
    .replaceAll(/\s+/g, ' ')
    .replaceAll(/@startuml/gi, 'startuml')
    .replaceAll(/@enduml/gi, 'enduml')
    .replaceAll('{', '(')
    .replaceAll('}', ')')
    .replaceAll('<', '(')
    .replaceAll('>', ')')
    .replaceAll('"', '\'')
    .replaceAll('[[', '(')
    .replaceAll(']]', ')')
    .trim()

  for (const [index, listIndex] of preservedListIndexes.entries()) {
    sanitized = sanitized.replaceAll(`__PUML_LIST_INDEX_${index}__`, listIndex)
  }

  for (const [index, fieldMarker] of preservedFieldMarkers.entries()) {
    sanitized = sanitized.replaceAll(`__PUML_FIELD_MARKER_${index}__`, fieldMarker)
  }

  return sanitized
}

function sanitizeCommentText (value: string): string {
  return value.replaceAll(/\s+/g, ' ').replaceAll('\'', '').trim()
}

function sanitizeStereotype (value: string): string {
  return value.replaceAll(/[^\w.-]/g, '') || 'Referable'
}

function escapeQuotedText (value: string): string {
  return sanitizeClassBodyText(value).replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`)
}

function isRecord (value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

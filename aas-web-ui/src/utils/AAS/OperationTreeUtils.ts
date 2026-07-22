import type {
  OperationNodeLocator,
  OperationNodeLocatorSegment,
  OperationOwnedTreeNode,
  OperationPersistenceBoundary,
  OperationVariableDirection,
} from '@/types/OperationTree'
import type { JsonValue } from '@aas-core-works/aas-core3.1-typescript/jsonization'
import { operationVariableDirections } from '@/types/OperationTree'

const operationDirectionSet = new Set<string>(operationVariableDirections)
const childCollectionSet = new Set(['value', 'statements', 'annotations'])

type UnknownRecord = Record<string, any>

function escapeJsonPointerSegment (segment: string): string {
  return segment.replaceAll('~', '~0').replaceAll('/', '~1')
}

function unescapeJsonPointerSegment (segment: string): string {
  return segment.replaceAll('~1', '/').replaceAll('~0', '~')
}

export function serializeOperationLocator (locator: OperationNodeLocator): string {
  if (locator.length === 0) {
    return ''
  }
  return `/${locator.map(segment => escapeJsonPointerSegment(String(segment))).join('/')}`
}

export function parseOperationLocator (fragment: string): OperationNodeLocator | null {
  if (fragment === '') {
    return []
  }
  if (!fragment.startsWith('/')) {
    return null
  }

  const rawSegments = fragment.slice(1).split('/').map(segment => unescapeJsonPointerSegment(segment))
  const locator: OperationNodeLocator = []

  for (const rawSegment of rawSegments) {
    if (/^(?:0|[1-9]\d*)$/.test(rawSegment)) {
      locator.push(Number(rawSegment))
      continue
    }

    if (
      operationDirectionSet.has(rawSegment)
      || rawSegment === 'value'
      || rawSegment === 'statements'
      || rawSegment === 'annotations'
    ) {
      locator.push(rawSegment as OperationNodeLocatorSegment)
      continue
    }

    return null
  }

  return locator
}

export function resolveOperationLocator (operation: unknown, locator: OperationNodeLocator): UnknownRecord | null {
  let current: unknown = operation

  for (let index = 0; index < locator.length; index += 1) {
    const segment = locator[index]

    if (typeof segment === 'number') {
      if (!Array.isArray(current) || segment < 0 || segment >= current.length) {
        return null
      }
      current = current[segment]
      continue
    }

    if (!current || typeof current !== 'object') {
      return null
    }
    const record = current as UnknownRecord

    if (operationDirectionSet.has(segment)) {
      if (record.modelType !== 'Operation') {
        return null
      }
      current = record[segment]
      continue
    }

    if (segment === 'value') {
      const previousSegment = locator[index - 1]
      if (typeof previousSegment === 'number' && 'value' in record && !('modelType' in record)) {
        current = record.value
        continue
      }
      if (!['SubmodelElementCollection', 'SubmodelElementList'].includes(record.modelType)) {
        return null
      }
      current = record.value
      continue
    }

    if (segment === 'statements') {
      if (record.modelType !== 'Entity') {
        return null
      }
      current = record.statements
      continue
    }

    if (segment === 'annotations') {
      if (record.modelType !== 'AnnotatedRelationshipElement') {
        return null
      }
      current = record.annotations
      continue
    }

    return null
  }

  return current && typeof current === 'object' ? current as UnknownRecord : null
}

export function canonicalTreeElementJson (value: unknown): string {
  return JSON.stringify(sortJsonValue(stripTreeMetadata(value)))
}

function sortJsonValue (value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(entry => sortJsonValue(entry)) as JsonValue
  }
  if (!value || typeof value !== 'object') {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortJsonValue(entry)]),
  ) as JsonValue
}

export function stripTreeMetadata (value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return value as unknown as JsonValue
  }
  if (Array.isArray(value)) {
    return value.map(entry => stripTreeMetadata(entry)) as JsonValue
  }
  if (typeof value !== 'object') {
    return value as JsonValue
  }

  const source = value as UnknownRecord
  const result: UnknownRecord = {}
  const ignoredKeys = new Set([
    'children',
    'parent',
    'path',
    'selectionKey',
    'persistence',
    'operationVariableDirection',
    'operationVariableIndex',
    'isDirectOperationVariable',
    'showChildren',
    'timestamp',
    'conceptDescriptions',
    'listIndex',
    'idLower',
    'idShortLower',
    'nameLower',
    'descLower',
    'endpoints',
    'validationError',
  ])

  for (const [key, entry] of Object.entries(source)) {
    if (!ignoredKeys.has(key)) {
      result[key] = stripTreeMetadata(entry)
    }
  }

  return result as JsonValue
}

export function createOperationPersistenceBoundary (
  operationPath: string,
  locator: OperationNodeLocator,
  value: unknown,
): OperationPersistenceBoundary {
  return {
    kind: 'operation',
    operationPath,
    locator: [...locator],
    fragment: serializeOperationLocator(locator),
    expectedJson: canonicalTreeElementJson(value),
  }
}

export function decorateResolvedOperationNode (
  value: UnknownRecord,
  operationPath: string,
  locator: OperationNodeLocator,
): OperationOwnedTreeNode {
  const fragment = serializeOperationLocator(locator)
  const node: OperationOwnedTreeNode = {
    ...value,
    path: `${operationPath}#${fragment}`,
    selectionKey: `${operationPath}#${fragment}`,
    persistence: createOperationPersistenceBoundary(operationPath, locator, value),
  }
  const direction = locator.at(-3)
  const variableIndex = locator.at(-2)
  if (
    typeof direction === 'string'
    && operationDirectionSet.has(direction)
    && typeof variableIndex === 'number'
    && locator.at(-1) === 'value'
  ) {
    node.operationVariableDirection = direction as OperationVariableDirection
    node.operationVariableIndex = variableIndex
    node.isDirectOperationVariable = true
  }
  return node
}

export function isOperationOwnedNode (value: unknown): value is OperationOwnedTreeNode {
  if (!value || typeof value !== 'object') {
    return false
  }
  const persistence = (value as UnknownRecord).persistence
  return persistence?.kind === 'operation'
}

/**
 * Synchronizes a freshly resolved Operation-owned node into an existing tree.
 * The matching object is updated in place so expansion state and sibling nodes
 * remain untouched.
 */
export function synchronizeOperationOwnedTreeNode (
  tree: unknown,
  updatedNode: OperationOwnedTreeNode,
): boolean {
  if (!Array.isArray(tree)) {
    return false
  }

  for (const item of tree) {
    if (!item || typeof item !== 'object') {
      continue
    }

    if (item.selectionKey === updatedNode.selectionKey) {
      Object.assign(item, updatedNode)
      return true
    }

    if (synchronizeOperationOwnedTreeNode(item.children, updatedNode)) {
      return true
    }
  }

  return false
}

export function isOperationVariableDirection (value: unknown): value is OperationVariableDirection {
  return typeof value === 'string' && operationDirectionSet.has(value)
}

export function getOperationChildCollectionKey (element: UnknownRecord): 'value' | 'statements' | 'annotations' | null {
  if (['SubmodelElementCollection', 'SubmodelElementList'].includes(element.modelType)) {
    return 'value'
  }
  if (element.modelType === 'Entity') {
    return 'statements'
  }
  if (element.modelType === 'AnnotatedRelationshipElement') {
    return 'annotations'
  }
  return null
}

export function isAllowedOperationLocatorSegment (value: string): boolean {
  return operationDirectionSet.has(value) || childCollectionSet.has(value)
}

export function verificationPathToOperationLocator (
  operation: unknown,
  verificationPath: string,
): OperationNodeLocator {
  const tokens = [...verificationPath.matchAll(/\.([a-z][a-z0-9]*)|\[(\d+)\]/gi)]
    .map(match => match[1] ?? Number(match[2]))
  const locator: OperationNodeLocator = []
  let current: any = operation

  for (const token of tokens) {
    if (typeof token === 'number') {
      if (!Array.isArray(current) || token >= current.length) {
        break
      }
      locator.push(token)
      current = current[token]
      continue
    }

    if (!current || typeof current !== 'object') {
      break
    }
    if (operationDirectionSet.has(token) && current.modelType === 'Operation') {
      locator.push(token as OperationVariableDirection)
      current = current[token]
      continue
    }
    if (token === 'value') {
      const isVariableWrapper = !('modelType' in current) && 'value' in current
      const isValueContainer = ['SubmodelElementCollection', 'SubmodelElementList'].includes(current.modelType)
      if (!isVariableWrapper && !isValueContainer) {
        break
      }
      locator.push('value')
      current = current.value
      continue
    }
    if (token === 'statements' && current.modelType === 'Entity') {
      locator.push('statements')
      current = current.statements
      continue
    }
    if (token === 'annotations' && current.modelType === 'AnnotatedRelationshipElement') {
      locator.push('annotations')
      current = current.annotations
      continue
    }
    break
  }

  return locator
}

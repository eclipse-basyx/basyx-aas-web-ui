export const operationVariableDirections = [
  'inputVariables',
  'inoutputVariables',
  'outputVariables',
] as const

export type OperationVariableDirection = (typeof operationVariableDirections)[number]

export type OperationNodeLocatorSegment = OperationVariableDirection | 'value' | 'statements' | 'annotations' | number

export type OperationNodeLocator = OperationNodeLocatorSegment[]

export interface OperationPersistenceBoundary {
  kind: 'operation'
  operationPath: string
  locator: OperationNodeLocator
  fragment: string
  expectedJson: string
}

export interface RepositoryPersistenceBoundary {
  kind: 'repository'
  repositoryPath: string
}

export type TreeNodePersistence = OperationPersistenceBoundary | RepositoryPersistenceBoundary

export interface OperationOwnedTreeNode {
  [key: string]: unknown
  modelType?: string
  idShort?: string | null
  path?: string
  selectionKey: string
  persistence: OperationPersistenceBoundary
  operationVariableDirection?: OperationVariableDirection
  operationVariableIndex?: number
  isDirectOperationVariable?: boolean
  parent?: unknown
  children?: OperationOwnedTreeNode[]
}

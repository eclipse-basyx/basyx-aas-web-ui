export type QueryTarget = 'aas-repository' | 'aas-registry' | 'submodel-repository'

export interface QueryLanguageQuery {
  $condition: Record<string, unknown>
  $filters?: Array<Record<string, unknown>>
  $select?: string
}

export interface QueryPage<T> {
  items: T[]
  nextCursor?: string
  hasMore: boolean
  success: boolean
}

export type QuerySearchMode = 'quick' | 'filters' | 'advanced'

export type QueryFilterMatchMode = 'all' | 'any'

export type QueryFilterOperator
  = 'contains'
    | 'equals'
    | 'not-equals'
    | 'starts-with'
    | 'ends-with'
    | 'regex'

export type QueryFilterFieldKey
  = 'id'
    | 'idShort'
    | 'assetKind'
    | 'assetType'
    | 'globalAssetId'
    | 'specificAssetId'
    | 'semanticId'
    | 'supplementalSemanticId'

export interface QueryFilter {
  id: string
  field: QueryFilterFieldKey
  operator: QueryFilterOperator
  value: string
}

export interface QueryFilterFieldDefinition {
  key: QueryFilterFieldKey
  label: string
  path: string
  operators: QueryFilterOperator[]
  valueOptions?: Array<{ title: string, value: string }>
}

export interface ParsedQuerySearchExpression {
  text: string
  filters: QueryFilter[]
  incompleteField?: QueryFilterFieldKey
}

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

export type QuerySearchMode = 'quick' | 'advanced'

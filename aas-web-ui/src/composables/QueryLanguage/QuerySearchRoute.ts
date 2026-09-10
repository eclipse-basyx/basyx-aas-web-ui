import type { QueryLanguageQuery } from '@/types/QueryLanguage'
import type { LocationQueryRaw, LocationQueryValue } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'

export type QuerySearchRouteState
  = { mode: 'none' }
    | { mode: 'search', expression: string }
    | { mode: 'advanced', queryText: string }

export function useQuerySearchRoute (searchParameter: string, queryParameter: string) {
  const route = useRoute()
  const router = useRouter()

  const state = computed<QuerySearchRouteState>(() => {
    const advancedQuery = queryValue(route.query[queryParameter])
    if (advancedQuery) {
      return { mode: 'advanced', queryText: advancedQuery }
    }

    const searchExpression = queryValue(route.query[searchParameter])
    return searchExpression
      ? { mode: 'search', expression: searchExpression }
      : { mode: 'none' }
  })

  async function commitSearch (expression: string, additionalQuery: LocationQueryRaw = {}): Promise<boolean> {
    const normalized = expression.trim()
    if (state.value.mode === 'search' && state.value.expression === normalized && queryMatches(additionalQuery)) {
      return false
    }

    await pushState(normalized ? { mode: 'search', expression: normalized } : { mode: 'none' }, additionalQuery)
    return true
  }

  async function commitAdvancedQuery (query: QueryLanguageQuery, additionalQuery: LocationQueryRaw = {}): Promise<boolean> {
    const queryText = JSON.stringify(query)
    if (state.value.mode === 'advanced' && state.value.queryText === queryText && queryMatches(additionalQuery)) {
      return false
    }

    await pushState({ mode: 'advanced', queryText }, additionalQuery)
    return true
  }

  async function clear (additionalQuery: LocationQueryRaw = {}): Promise<boolean> {
    if (state.value.mode === 'none' && queryMatches(additionalQuery)) {
      return false
    }

    await pushState({ mode: 'none' }, additionalQuery)
    return true
  }

  async function pushState (nextState: QuerySearchRouteState, additionalQuery: LocationQueryRaw): Promise<void> {
    const query = { ...route.query }
    delete query[searchParameter]
    delete query[queryParameter]

    if (nextState.mode === 'search') {
      query[searchParameter] = nextState.expression
    } else if (nextState.mode === 'advanced') {
      query[queryParameter] = nextState.queryText
    }

    applyAdditionalQuery(query, additionalQuery)

    await router.push({ query })
  }

  function queryMatches (additionalQuery: LocationQueryRaw): boolean {
    return Object.entries(additionalQuery).every(([key, value]) => {
      if (value === undefined || value === null) {
        return route.query[key] === undefined
      }
      return String(route.query[key] ?? '') === String(value)
    })
  }

  return {
    clear,
    commitAdvancedQuery,
    commitSearch,
    state,
  }
}

function applyAdditionalQuery (query: LocationQueryRaw, additionalQuery: LocationQueryRaw): void {
  for (const [key, value] of Object.entries(additionalQuery)) {
    if (value === undefined || value === null) {
      delete query[key]
    } else {
      query[key] = value
    }
  }
}

function queryValue (value: LocationQueryValue | LocationQueryValue[]): string {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (Array.isArray(value)) {
    return value.find(item => typeof item === 'string')?.trim() ?? ''
  }
  return ''
}

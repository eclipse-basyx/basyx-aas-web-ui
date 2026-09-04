import type { QueryLanguageQuery } from '@/types/QueryLanguage'
import type { LocationQueryValue } from 'vue-router'
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

  async function commitSearch (expression: string): Promise<boolean> {
    const normalized = expression.trim()
    if (state.value.mode === 'search' && state.value.expression === normalized) {
      return false
    }

    await pushState(normalized ? { mode: 'search', expression: normalized } : { mode: 'none' })
    return true
  }

  async function commitAdvancedQuery (query: QueryLanguageQuery): Promise<boolean> {
    const queryText = JSON.stringify(query)
    if (state.value.mode === 'advanced' && state.value.queryText === queryText) {
      return false
    }

    await pushState({ mode: 'advanced', queryText })
    return true
  }

  async function clear (): Promise<boolean> {
    if (state.value.mode === 'none') {
      return false
    }

    await pushState({ mode: 'none' })
    return true
  }

  async function pushState (nextState: QuerySearchRouteState): Promise<void> {
    const query = { ...route.query }
    delete query[searchParameter]
    delete query[queryParameter]

    if (nextState.mode === 'search') {
      query[searchParameter] = nextState.expression
    } else if (nextState.mode === 'advanced') {
      query[queryParameter] = nextState.queryText
    }

    await router.push({ query })
  }

  return {
    clear,
    commitAdvancedQuery,
    commitSearch,
    state,
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

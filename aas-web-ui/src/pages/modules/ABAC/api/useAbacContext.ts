import type { AbacClientOptions } from '../types/api'
import { useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../constants/cache'
import { useAbacConfigStore } from '../stores/useAbacConfigStore'
import { useAbacClient } from './useAbacClient'

export function useAbacContext (options: AbacClientOptions = {}) {
  const client = useAbacClient(options)
  const queryClient = useQueryClient()
  const configStore = useAbacConfigStore()

  const apiUrl = computed(() => configStore.apiUrl)
  const hasApiUrl = computed(() => !!apiUrl.value?.trim())

  const keys = {
    all: () => [apiUrl.value] as const,
    policies: () => [apiUrl.value, ABAC_CACHE_KEYS.POLICIES] as const,
    policy: (versionId?: string) => [apiUrl.value, ABAC_CACHE_KEYS.POLICIES, versionId] as const,
    rules: (versionId?: string) => [apiUrl.value, ABAC_CACHE_KEYS.RULES, versionId] as const,
    rule: (versionId?: string, ruleIndex?: string | number) => [apiUrl.value, ABAC_CACHE_KEYS.RULES, versionId, ruleIndex] as const,
    definitions: (versionId?: string) => [apiUrl.value, ABAC_CACHE_KEYS.DEFINITIONS, versionId] as const,
    definition: (versionId?: string, kind?: string, name?: string) => [apiUrl.value, ABAC_CACHE_KEYS.DEFINITIONS, versionId, kind, name] as const,

  }

  function invalidate (...queryKeys: (readonly unknown[])[]) {
    for (const queryKey of queryKeys) {
      queryClient.invalidateQueries({ queryKey: [...queryKey] })
    }
  }

  function remove (...queryKeys: (readonly unknown[])[]) {
    for (const queryKey of queryKeys) {
      queryClient.removeQueries({ queryKey: [...queryKey] })
    }
  }

  return { client, invalidate, remove, hasApiUrl, keys }
}

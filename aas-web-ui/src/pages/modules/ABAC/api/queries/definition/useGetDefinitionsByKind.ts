import type { DefinitionKind } from '../../../types/definitions'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref, unref } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useGetDefinitionsByKind (
  versionId: Ref<string | undefined> | string | undefined,
  kind: Ref<DefinitionKind | undefined> | DefinitionKind | undefined,
) {
  const client = useAbacClient(true)

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  const idRef = computed(() => unref(versionId))
  const kindRef = computed(() => unref(kind))

  return useQuery({
    queryKey: computed(() => [ABAC_CACHE_KEYS.DEFINITIONS, apiUrl.value, idRef.value, kindRef.value]),
    enabled: computed(() =>
      idRef.value !== undefined
      && kindRef.value !== undefined
      && !!apiUrl.value?.trim(),
    ),
    queryFn: async () => {
      const response = await client.getDefinitionsByKind(idRef.value!, kindRef.value!)
      if (!response.success || !response.data) {
        throw new Error('Failed to load ABAC definitions by kind')
      }
      return response.data
    },
  })
}

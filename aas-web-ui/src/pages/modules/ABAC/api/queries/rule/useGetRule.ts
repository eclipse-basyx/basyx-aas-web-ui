import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref, unref } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useGetRule (
  versionId: Ref<string | undefined> | string | undefined,
  ruleIndex: Ref<string | undefined> | string | undefined,
) {
  const client = useAbacClient(true)

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  const idRef = computed(() => unref(versionId))
  const indexRef = computed(() => unref(ruleIndex))

  return useQuery({
    queryKey: computed(() => [ABAC_CACHE_KEYS.RULES, apiUrl.value, idRef.value, indexRef.value]),
    enabled: computed(() => idRef.value !== undefined && indexRef.value !== undefined && !!apiUrl.value?.trim()),
    queryFn: async () => {
      const response = await client.getRule(idRef.value!, indexRef.value!)
      if (!response.success || !response.data) {
        throw new Error('Failed to load ABAC rule')
      }
      return response.data
    },
  })
}

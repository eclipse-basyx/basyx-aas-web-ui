import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useGetActivePolicyRules () {
  const client = useAbacClient(true)

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  return useQuery({
    queryKey: computed(() => [ABAC_CACHE_KEYS.ACTIVE_POLICY, apiUrl.value, ABAC_CACHE_KEYS.RULES]),
    enabled: computed(() => !!apiUrl.value?.trim()),
    queryFn: async () => {
      const response = await client.getActivePolicyRules()
      if (!response.success || !response.data) {
        throw new Error('Failed to load active ABAC policy rules')
      }
      return response.data
    },
  })
}

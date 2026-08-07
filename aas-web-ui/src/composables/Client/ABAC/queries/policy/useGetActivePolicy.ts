import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useGetActivePolicy () {
  const client = useAbacClient(true)

  const infrastructureStore = useInfrastructureStore()
  const aasRegistryUrl = computed(() => infrastructureStore.getAASRegistryURL)

  return useQuery({
    queryKey: [ABAC_CACHE_KEYS.ACTIVE_POLICY],
    enabled: computed(() => !!aasRegistryUrl.value?.trim()),
    queryFn: async () => {
      const response = await client.getActivePolicy()
      if (!response.success || !response.data) {
        throw new Error('Failed to load active ABAC policy')
      }
      return response.data
    },
  })
}

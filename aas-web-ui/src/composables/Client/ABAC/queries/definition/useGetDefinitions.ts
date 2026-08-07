import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref, unref } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useGetDefinitions (versionId: Ref<string | undefined> | string | undefined) {
  const client = useAbacClient(true)

  const infrastructureStore = useInfrastructureStore()
  const aasRegistryUrl = computed(() => infrastructureStore.getAASRegistryURL)

  const idRef = computed(() => unref(versionId))

  return useQuery({
    queryKey: computed(() => [ABAC_CACHE_KEYS.DEFINITIONS, idRef.value]),
    enabled: computed(() => idRef.value !== undefined && !!aasRegistryUrl.value?.trim()),
    queryFn: async () => {
      const response = await client.getDefinitions(idRef.value!)
      if (!response.success || !response.data) {
        throw new Error('Failed to load ABAC definitions')
      }
      return response.data
    },
  })
}

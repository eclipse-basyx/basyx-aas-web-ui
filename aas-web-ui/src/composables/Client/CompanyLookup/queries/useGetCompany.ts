import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref, unref } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { CACHE_KEYS } from '../constants/cache'
import { useCompanyLookupClient } from '../useCompanyLookupClient'

export function useGetCompany (id: Ref<string | undefined> | string | undefined) {
  const client = useCompanyLookupClient(true)

  const infrastructureStore = useInfrastructureStore()
  const companyLookupApiUrl = computed(() => infrastructureStore.getCompanyLookupURL)

  const idRef = computed(() => unref(id))

  return useQuery({
    queryKey: computed(() => [CACHE_KEYS.COMPANY, idRef.value ?? '']),
    enabled: computed(() => !!idRef.value && !!companyLookupApiUrl.value?.trim()),
    queryFn: async () => {
      const response = await client.getCompanyDescriptorById(idRef.value!)
      if (!response.success || !response.data) {
        throw new Error('Failed to load company')
      }
      return response.data
    },
  })
}

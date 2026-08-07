import type { PolicyVersion } from '../../types/policy'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useGetPolicies () {
  const client = useAbacClient(true)

  const infrastructureStore = useInfrastructureStore()
  const aasRegistryUrl = computed(() => infrastructureStore.getAASRegistryURL)

  function group (policies: PolicyVersion[]): PolicyVersion[] {
    const active = policies.filter(({ status }) => status === 'active')
    const staged = policies.filter(({ status }) => status === 'staged')
    const rejected = policies.filter(({ status }) => status === 'rejected')
    const superseded = policies.filter(({ status }) => status === 'superseded')

    return [...active, ...staged, ...rejected, ...superseded]
  }

  return useQuery({
    queryKey: [ABAC_CACHE_KEYS.POLICIES],
    enabled: computed(() => !!aasRegistryUrl.value?.trim()),
    queryFn: async () => {
      const response = await client.getPolicyVersions()
      if (!response.success || !response.data) {
        throw new Error('Failed to load ABAC policy versions')
      }
      return response.data
    },
    select: group,
  })
}

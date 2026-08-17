import type { PolicyVersion } from '../../../types/policy'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useGetPolicies () {
  const client = useAbacClient(true)

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  function group (policies: PolicyVersion[]): PolicyVersion[] {
    const active = policies.filter(({ status }) => status === 'active')
    const staged = policies.filter(({ status }) => status === 'staged')
    const rejected = policies.filter(({ status }) => status === 'rejected')
    const superseded = policies.filter(({ status }) => status === 'superseded')

    return [...active, ...staged, ...rejected, ...superseded]
  }

  return useQuery({
    queryKey: computed(() => [ABAC_CACHE_KEYS.POLICIES, apiUrl.value]),
    enabled: computed(() => !!apiUrl.value?.trim()),
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

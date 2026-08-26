import type { PolicyVersion } from '@/pages/modules/ABAC/types/policy'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useGetPolicies () {
  const { client, keys, hasApiUrl } = useAbacContext(true)

  function group (policies: PolicyVersion[]): PolicyVersion[] {
    const active = policies.filter(({ status }) => status === 'active')
    const staged = policies.filter(({ status }) => status === 'staged')
    const rejected = policies.filter(({ status }) => status === 'rejected')
    const superseded = policies.filter(({ status }) => status === 'superseded')
    return [...active, ...staged, ...rejected, ...superseded]
  }

  return useQuery({
    queryKey: computed(() => keys.policies()),
    enabled: hasApiUrl,
    queryFn: client.getPolicyVersions,
    select: group,
  })
}

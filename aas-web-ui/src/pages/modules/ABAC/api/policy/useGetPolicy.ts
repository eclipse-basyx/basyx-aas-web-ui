import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useGetPolicy (versionId: MaybeRefOrGetter<string | undefined>) {
  const { client, keys, hasApiUrl } = useAbacContext(true)
  const id = computed(() => toValue(versionId))

  return useQuery({
    queryKey: computed(() => keys.policy(id.value)),
    enabled: computed(() => id.value !== undefined && hasApiUrl.value),
    queryFn: () => client.getPolicyVersion(id.value!),
  })
}

import type { MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useGetRules (versionId: MaybeRefOrGetter<string | undefined>) {
  const { client, keys, hasApiUrl } = useAbacContext(true)
  const idRef = computed(() => toValue(versionId))

  return useQuery({
    queryKey: computed(() => keys.rules(idRef.value)),
    enabled: computed(() => idRef.value !== undefined && hasApiUrl.value),
    queryFn: () => client.getRules(idRef.value!),
  })
}

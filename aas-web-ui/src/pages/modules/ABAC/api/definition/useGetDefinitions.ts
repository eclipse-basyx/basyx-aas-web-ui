import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useGetDefinitions (versionId: MaybeRefOrGetter<string | undefined>) {
  const { client, keys, hasApiUrl } = useAbacContext(true)
  const idRef = computed(() => toValue(versionId))

  return useQuery({
    queryKey: computed(() => keys.definitions(idRef.value)),
    enabled: computed(() => idRef.value !== undefined && hasApiUrl.value),
    queryFn: () => client.getDefinitions(idRef.value!),
  })
}

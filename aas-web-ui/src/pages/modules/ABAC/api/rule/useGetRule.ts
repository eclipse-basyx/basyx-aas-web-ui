import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useGetRule (
  versionId: MaybeRefOrGetter<string | undefined>,
  ruleIndex: MaybeRefOrGetter<string | undefined>,
) {
  const { client, keys, hasApiUrl } = useAbacContext(true)
  const idRef = computed(() => toValue(versionId))
  const indexRef = computed(() => toValue(ruleIndex))

  return useQuery({
    queryKey: computed(() => keys.rule(idRef.value, indexRef.value)),
    enabled: computed(() => idRef.value !== undefined && indexRef.value !== undefined && hasApiUrl.value),
    queryFn: () => client.getRule(idRef.value!, indexRef.value!),
  })
}

import type { DefinitionKind } from '@/pages/modules/ABAC/types/definitions'
import type { MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useGetDefinition (
  versionId: MaybeRefOrGetter<string | undefined>,
  kind: MaybeRefOrGetter<DefinitionKind | undefined>,
  name: MaybeRefOrGetter<string | undefined>,
) {
  const { client, keys, hasApiUrl } = useAbacContext(true)
  const idRef = computed(() => toValue(versionId))
  const kindRef = computed(() => toValue(kind))
  const nameRef = computed(() => toValue(name))

  return useQuery({
    queryKey: computed(() => keys.definition(idRef.value, kindRef.value, nameRef.value)),
    enabled: computed(() => idRef.value !== undefined && kindRef.value !== undefined && nameRef.value !== undefined && hasApiUrl.value),
    queryFn: () => client.getDefinition(idRef.value!, kindRef.value!, nameRef.value!),
  })
}

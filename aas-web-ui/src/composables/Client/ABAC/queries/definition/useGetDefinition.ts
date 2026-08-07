import type { DefinitionKind } from '../../types/definitions'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref, unref } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useGetDefinition (
  versionId: Ref<string | undefined> | string | undefined,
  kind: Ref<DefinitionKind | undefined> | DefinitionKind | undefined,
  name: Ref<string | undefined> | string | undefined,
) {
  const client = useAbacClient(true)

  const infrastructureStore = useInfrastructureStore()
  const aasRegistryUrl = computed(() => infrastructureStore.getAASRegistryURL)

  const idRef = computed(() => unref(versionId))
  const kindRef = computed(() => unref(kind))
  const nameRef = computed(() => unref(name))

  return useQuery({
    queryKey: computed(() => [ABAC_CACHE_KEYS.DEFINITIONS, idRef.value, kindRef.value, nameRef.value]),
    enabled: computed(() =>
      idRef.value !== undefined
      && kindRef.value !== undefined
      && nameRef.value !== undefined
      && !!aasRegistryUrl.value?.trim(),
    ),
    queryFn: async () => {
      const response = await client.getDefinition(idRef.value!, kindRef.value!, nameRef.value!)
      if (!response.success || !response.data) {
        throw new Error('Failed to load ABAC definition')
      }
      return response.data
    },
  })
}

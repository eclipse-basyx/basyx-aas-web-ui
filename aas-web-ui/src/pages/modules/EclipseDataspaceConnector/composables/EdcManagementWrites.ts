import type { MaybeRefOrGetter } from 'vue'
import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
import { useLoadGeneration } from '@/composables/LoadGeneration'

/**
 * Whether the EDC BFF lets the given proxy create, update and delete assets, policies and contracts.
 * Stays `false` while the status loads and when it can't be loaded, so the UI never offers a write the BFF refuses.
 */
export function useEdcManagementWrites (proxyId: MaybeRefOrGetter<string>) {
  const { fetchStatus } = useCatenaXEdcClient()

  const managementWritesAllowed = ref(false)
  const statusLoad = useLoadGeneration() // Ignores the response for a proxy that is no longer selected

  watch(() => toValue(proxyId), async id => {
    const generation = statusLoad.start()
    managementWritesAllowed.value = false

    const status = await fetchStatus(id)
    if (statusLoad.isCurrent(generation)) {
      managementWritesAllowed.value = status?.managementWritesAllowed === true
    }
    statusLoad.finish(generation)
  }, { immediate: true })

  return { managementWritesAllowed }
}

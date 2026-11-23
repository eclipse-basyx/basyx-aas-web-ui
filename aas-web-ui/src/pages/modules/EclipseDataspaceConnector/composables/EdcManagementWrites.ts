import type { MaybeRefOrGetter } from 'vue'
import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'

/**
 * Whether the EDC BFF lets the given proxy create, update and delete assets, policies and contracts.
 * Stays `false` while the status loads and when it can't be loaded, so the UI never offers a write the BFF refuses.
 */
export function useEdcManagementWrites (proxyId: MaybeRefOrGetter<string>) {
  const { fetchStatus } = useCatenaXEdcClient()

  const managementWritesAllowed = ref(false)
  let statusRequest = 0 // Ignores the response for a proxy that is no longer selected

  watch(() => toValue(proxyId), async id => {
    const request = ++statusRequest
    managementWritesAllowed.value = false

    const status = await fetchStatus(id)
    if (request === statusRequest) {
      managementWritesAllowed.value = status?.managementWritesAllowed === true
    }
  }, { immediate: true })

  return { managementWritesAllowed }
}

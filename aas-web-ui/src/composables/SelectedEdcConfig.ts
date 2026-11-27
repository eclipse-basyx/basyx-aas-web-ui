import { useInfrastructureStore } from '@/store/InfrastructureStore'

// Proxy of the EDC BFF for an EDC configuration that names none, the same as `defaultProxyId` of the EDC BFF
export const DEFAULT_EDC_PROXY_ID = 'default'

/**
 * EDC configuration of the selected infrastructure and the ID of its proxy in the EDC BFF.
 * The proxy ID is `default` when the configuration names none or an empty one.
 */
export function useSelectedEdcConfig () {
  const infrastructureStore = useInfrastructureStore()

  const selectedEdcConfig = computed(() => infrastructureStore.getSelectedInfrastructure?.catenaX?.edc ?? null)
  const edcProxyId = computed(() => selectedEdcConfig.value?.proxyId?.trim() || DEFAULT_EDC_PROXY_ID)

  return { selectedEdcConfig, edcProxyId }
}

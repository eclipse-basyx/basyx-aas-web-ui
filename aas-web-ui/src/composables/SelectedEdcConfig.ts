import { useInfrastructureStore } from '@/store/InfrastructureStore'

/**
 * EDC configuration of the selected infrastructure and the ID of its proxy in the EDC BFF.
 * The proxy ID is `default` when the configuration names none or an empty one.
 */
export function useSelectedEdcConfig () {
  const infrastructureStore = useInfrastructureStore()

  const selectedEdcConfig = computed(() => infrastructureStore.getSelectedInfrastructure?.catenaX?.edc ?? null)
  const edcProxyId = computed(() => selectedEdcConfig.value?.proxyId?.trim() || 'default')

  return { selectedEdcConfig, edcProxyId }
}

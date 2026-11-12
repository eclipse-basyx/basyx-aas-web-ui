import { useRoute } from 'vue-router'
import { useAASStore } from '@/store/AASDataStore'
import { useEnvStore } from '@/store/EnvironmentStore'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { getActiveComponentKeys } from '@/utils/InfrastructureUtils'

export function useBackendSetupNotice () {
  const route = useRoute()
  const aasStore = useAASStore()
  const envStore = useEnvStore()
  const infrastructureStore = useInfrastructureStore()

  const canShowNotice = computed(() => {
    const dataRoutes = [
      'AASViewer', 'AASEditor', 'AASSubmodelViewer', 'AASList', 'SubmodelList',
      'SMViewer', 'SMEditor', 'ComponentVisualization', 'Visualization',
    ]
    return dataRoutes.includes(String(route.name))
      && !envStore.getSingleAas
      && !envStore.getSingleSm
      && !aasStore.getSelectedAAS?.id
      && !aasStore.getSelectedNode?.modelType
  })

  const isSetupPending = computed(() => canShowNotice.value && !infrastructureStore.isInitialized)

  const showNotice = computed(() => {
    if (
      !canShowNotice.value
      || !infrastructureStore.isInitialized
      || infrastructureStore.getIsAuthenticating
      || infrastructureStore.getIsTestingConnections
    ) {
      return false
    }

    const infrastructure = infrastructureStore.getSelectedInfrastructure
    if (!infrastructure) {
      return true
    }

    const activeKeys = getActiveComponentKeys(infrastructure)
    // EDC infrastructures establish their connections inside the Catena-X module.
    return activeKeys.length > 0 && activeKeys.every(key => {
      const component = infrastructureStore.getBasyxComponents[key]
      return !component.loading && component.connected === false
    })
  })

  return { showNotice, isSetupPending }
}

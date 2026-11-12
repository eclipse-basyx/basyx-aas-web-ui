import { useRoute } from 'vue-router'
import { useAASStore } from '@/store/AASDataStore'
import { useEnvStore } from '@/store/EnvironmentStore'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { getActiveComponentKeys, usesSubmodelSuperpath } from '@/utils/InfrastructureUtils'

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

  const noticeState = computed<{ kind: 'setup' | 'unreachable' | null, pending: boolean, connected?: boolean }>(() => {
    const hidden = { kind: null, pending: false }
    if (!canShowNotice.value) {
      return hidden
    }
    if (!infrastructureStore.isInitialized) {
      return { kind: null, pending: true }
    }
    if (infrastructureStore.getIsAuthenticating || infrastructureStore.getIsTestingConnections) {
      return hidden
    }

    const infrastructure = infrastructureStore.getSelectedInfrastructure
    if (!infrastructure) {
      return { kind: 'setup', pending: false }
    }

    const submodelView = ['SMViewer', 'SMEditor'].includes(String(route.name))
    const sourceKeys = usesSubmodelSuperpath(infrastructure)
      ? ['AASRepo']
      : (submodelView ? ['SubmodelRepo'] : ['AASRepo', 'AASRegistry'])
    const activeKeys = getActiveComponentKeys(infrastructure).filter(key => sourceKeys.includes(key))
    // EDC infrastructures establish their connections inside the Catena-X module.
    if (activeKeys.length === 0) {
      return hidden
    }

    const configuredKeys = activeKeys.filter(key => normalizeUrl(infrastructure.components[key]?.url))
    if (configuredKeys.length === 0) {
      return { kind: 'setup', pending: false }
    }

    const states = configuredKeys.map(key => {
      const result = infrastructureStore.getComponentConnectionResults[key]
      return result?.infrastructureId === infrastructure.id
        && result.url === normalizeUrl(infrastructure.components[key]?.url)
        ? result.state
        : undefined
    })
    if (states.includes('connected')) {
      return { ...hidden, connected: true }
    }
    if (states.some(state => state === undefined || state === 'checking')) {
      return { kind: null, pending: true }
    }
    if (states.every(state => state === 'unreachable')) {
      return { kind: 'unreachable', pending: false }
    }
    return hidden
  })

  const noticeKind = computed(() => noticeState.value.kind)
  const showNotice = computed(() => noticeKind.value !== null)
  const isSetupPending = computed(() => noticeState.value.pending)
  const infrastructureName = computed(() => infrastructureStore.getSelectedInfrastructure?.name?.trim() || 'selected infrastructure')
  const hasUsableConnection = computed(() => noticeState.value.connected === true)

  return { showNotice, isSetupPending, noticeKind, infrastructureName, hasUsableConnection }
}

function normalizeUrl (url: string | undefined): string {
  return url?.trim().replace(/\/+$/, '') ?? ''
}

import type { BaSyxComponentKey } from '@/types/BaSyx'
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

  const isGlobalSubmodelView = computed(() => ['SMViewer', 'SMEditor'].includes(String(route.name)))
  const isDataView = computed(() => [
    'AASViewer', 'AASEditor', 'AASSubmodelViewer', 'AASList', 'SubmodelList',
    'SMViewer', 'SMEditor', 'ComponentVisualization', 'Visualization',
  ].includes(String(route.name)))
  const activeComponentKeys = computed(() => {
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    return infrastructure ? getActiveComponentKeys(infrastructure) : []
  })
  const relevantSourceKeys = computed(() => {
    if (!isDataView.value) {
      return []
    }
    const sourceKeys: BaSyxComponentKey[] = isGlobalSubmodelView.value
      ? ['SubmodelRepo']
      : ['AASRepo', 'AASRegistry']
    return activeComponentKeys.value.filter(key => sourceKeys.includes(key))
  })
  const coveredDataSources = computed<Array<{ component: BaSyxComponentKey, url: string }>>(() => {
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    return relevantSourceKeys.value.flatMap(component => {
      const url = normalizeUrl(infrastructure?.components[component]?.url)
      return url ? [{ component, url }] : []
    })
  })

  const canShowNotice = computed(() => isDataView.value
    && !envStore.getSingleAas
    && !envStore.getSingleSm
    && (isGlobalSubmodelView.value || !aasStore.getSelectedAAS?.id)
    && !aasStore.getSelectedNode?.modelType)

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

    // EDC infrastructures establish their connections inside the Catena-X module.
    if (activeComponentKeys.value.length === 0) {
      return hidden
    }

    if (coveredDataSources.value.length === 0) {
      return { kind: 'setup', pending: false }
    }

    const states = coveredDataSources.value.map(({ component, url }) => {
      const result = infrastructureStore.getComponentConnectionResults[component]
      return result?.infrastructureId === infrastructure.id && result.url === url
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

  return { showNotice, isSetupPending, noticeKind, infrastructureName, hasUsableConnection, coveredDataSources }
}

function normalizeUrl (url: string | undefined): string {
  return url?.trim().replace(/\/+$/, '') ?? ''
}

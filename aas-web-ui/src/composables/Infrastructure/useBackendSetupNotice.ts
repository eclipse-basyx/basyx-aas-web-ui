import type { BaSyxComponentKey } from '@/types/BaSyx'
import { useRoute } from 'vue-router'
import { createSharedComposable } from '@/composables/SharedComposable'
import { useAASStore } from '@/store/AASDataStore'
import { useEnvStore } from '@/store/EnvironmentStore'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { getActiveComponentKeys } from '@/utils/InfrastructureUtils'
import { normalizeEndpointUrl } from '@/utils/url'

export type BackendSetupNoticeKind = 'setup' | 'unreachable'

interface NoticeState {
  kind: BackendSetupNoticeKind | null
  pending: boolean
  connected?: boolean
}

const SOURCE_KEYS: Record<'aas' | 'submodel', BaSyxComponentKey[]> = {
  aas: ['AASRepo', 'AASRegistry'],
  // Embedded AAS Submodel paths cannot enumerate Submodels globally.
  submodel: ['SubmodelRepo'],
}

function createBackendSetupNotice () {
  const route = useRoute()
  const aasStore = useAASStore()
  const envStore = useEnvStore()
  const infrastructureStore = useInfrastructureStore()

  const dataSource = computed(() => route.meta?.backendDataSource)
  const activeComponentKeys = computed(() => {
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    return infrastructure ? getActiveComponentKeys(infrastructure) : []
  })
  const coveredDataSources = computed<Array<{ component: BaSyxComponentKey, url: string }>>(() => {
    if (!dataSource.value) {
      return []
    }
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    return activeComponentKeys.value
      .filter(component => SOURCE_KEYS[dataSource.value!].includes(component))
      .flatMap(component => {
        const url = normalizeEndpointUrl(infrastructure?.components[component]?.url)
        return url ? [{ component, url }] : []
      })
  })

  const canShowNotice = computed(() => !!dataSource.value
    && !envStore.getSingleAas
    && !envStore.getSingleSm
    && (dataSource.value === 'submodel' || !aasStore.getSelectedAAS?.id)
    && !aasStore.getSelectedNode?.modelType)

  const noticeState = computed<NoticeState>(() => {
    const hidden: NoticeState = { kind: null, pending: false }
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

/** Shared by the setup banner and the snackbar, which suppresses errors the banner already explains. */
export const useBackendSetupNotice = createSharedComposable(createBackendSetupNotice)

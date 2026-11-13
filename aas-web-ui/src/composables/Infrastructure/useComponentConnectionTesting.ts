import type { BaSyxComponentKey } from '@/types/BaSyx'
import type {
  ComponentConnectionStatus,
  ComponentTestingLoading,
  InfrastructureConfig,
  InfrastructureTemplate,
} from '@/types/Infrastructure'
import type { InfrastructureEndpointFieldKey } from '@/utils/InfrastructureUtils'
import type { Ref } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import {
  BASYX_COMPONENT_KEYS,
  getEndpointFieldByKey,
  getEndpointFieldsForTemplate,
  getEndpointFieldValue,
} from '@/utils/InfrastructureUtils'

/**
 * Composable for managing BaSyx component connection testing
 */
export function useComponentConnectionTesting (): {
  componentConnectionStatus: Ref<ComponentConnectionStatus>
  componentTestingLoading: Ref<ComponentTestingLoading>
  testingAllConnections: Ref<boolean>
  testComponentConnection: (
    componentKey: BaSyxComponentKey,
    url: string,
    infrastructure?: InfrastructureConfig,
  ) => Promise<void>
  testEndpointField: (
    templateOrInfrastructure: InfrastructureTemplate | InfrastructureConfig,
    fieldKey: InfrastructureEndpointFieldKey,
    components: InfrastructureConfig['components'],
  ) => Promise<void>
  testAllConnections: (
    components: InfrastructureConfig['components'],
    templateOrInfrastructure: InfrastructureTemplate | InfrastructureConfig,
  ) => Promise<void>
  resetConnectionStatus: () => void
} {
  const infrastructureStore = useInfrastructureStore()

  // State
  const componentConnectionStatus = ref<ComponentConnectionStatus>({} as ComponentConnectionStatus)
  const componentTestingLoading = ref<ComponentTestingLoading>({} as ComponentTestingLoading)
  const testingAllConnections = ref(false)

  function updateGlobalTestingState (): void {
    infrastructureStore.dispatchIsTestingConnections(Object.values(componentTestingLoading.value).some(Boolean))
  }

  function setComponentTestingLoading (componentKey: BaSyxComponentKey, loading: boolean): void {
    componentTestingLoading.value[componentKey] = loading
    updateGlobalTestingState()
  }

  /**
   * Test connection to a single component
   */
  async function testComponentConnection (
    componentKey: BaSyxComponentKey,
    url: string,
    infrastructure?: InfrastructureConfig,
  ): Promise<void> {
    if (!url || url.trim() === '') {
      componentConnectionStatus.value[componentKey] = false
      setComponentTestingLoading(componentKey, false)
      return
    }

    componentConnectionStatus.value[componentKey] = null
    setComponentTestingLoading(componentKey, true)

    try {
      componentConnectionStatus.value[componentKey] = await infrastructureStore.probeComponentConnection(componentKey, url, infrastructure)
    } catch {
      componentConnectionStatus.value[componentKey] = false
    } finally {
      setComponentTestingLoading(componentKey, false)
    }
  }

  /**
   * Test connection to a visible endpoint field. Grouped endpoint fields fan out to
   * their mapped internal components.
   */
  async function testEndpointField (
    templateOrInfrastructure: InfrastructureTemplate | InfrastructureConfig,
    fieldKey: InfrastructureEndpointFieldKey,
    components: InfrastructureConfig['components'],
  ): Promise<void> {
    const endpointField = getEndpointFieldByKey(templateOrInfrastructure, fieldKey)
    if (!endpointField) {
      return
    }

    const url = getEndpointFieldValue(components, endpointField)
    const infrastructure = typeof templateOrInfrastructure === 'string'
      ? undefined
      : templateOrInfrastructure
    const testPromises = endpointField.componentKeys
      .map(key => testComponentConnection(key, url, infrastructure))
    await Promise.all(testPromises)
  }

  /**
   * Test all component connections
   */
  async function testAllConnections (
    components: InfrastructureConfig['components'],
    templateOrInfrastructure: InfrastructureTemplate | InfrastructureConfig,
  ): Promise<void> {
    testingAllConnections.value = true
    try {
      const infrastructure = typeof templateOrInfrastructure === 'string'
        ? undefined
        : templateOrInfrastructure
      const testPromises = getEndpointFieldsForTemplate(templateOrInfrastructure).flatMap(endpointField => {
        const url = getEndpointFieldValue(components, endpointField)
        return endpointField.componentKeys.map(key => testComponentConnection(key, url, infrastructure))
      })
      await Promise.all(testPromises)
    } finally {
      testingAllConnections.value = false
    }
  }

  /**
   * Reset connection status for all components
   */
  function resetConnectionStatus (): void {
    for (const key of BASYX_COMPONENT_KEYS) {
      componentConnectionStatus.value[key] = null
      componentTestingLoading.value[key] = false
    }
    updateGlobalTestingState()
  }

  return {
    // State
    componentConnectionStatus,
    componentTestingLoading,
    testingAllConnections,
    // Methods
    testComponentConnection,
    testEndpointField,
    testAllConnections,
    resetConnectionStatus,
  }
}

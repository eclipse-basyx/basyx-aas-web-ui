import type { BaSyxComponentKey } from '@/types/BaSyx'
import type {
  ComponentConnectionStatus,
  ComponentTestingLoading,
  InfrastructureConfig,
  InfrastructureTemplate,
} from '@/types/Infrastructure'
import type { InfrastructureEndpointFieldKey } from '@/utils/InfrastructureUtils'
import { type Ref, ref } from 'vue'
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
  testComponentConnection: (componentKey: BaSyxComponentKey, url: string) => Promise<void>
  testEndpointField: (
    template: InfrastructureTemplate,
    fieldKey: InfrastructureEndpointFieldKey,
    components: InfrastructureConfig['components'],
  ) => Promise<void>
  testAllConnections: (
    components: InfrastructureConfig['components'],
    template: InfrastructureTemplate,
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
  async function testComponentConnection (componentKey: BaSyxComponentKey, url: string): Promise<void> {
    if (!url || url.trim() === '') {
      componentConnectionStatus.value[componentKey] = false
      setComponentTestingLoading(componentKey, false)
      return
    }

    componentConnectionStatus.value[componentKey] = null
    const originalUrl = infrastructureStore.getBasyxComponents[componentKey].url
    setComponentTestingLoading(componentKey, true)

    try {
      // Temporarily set the component URL in the store to test it
      infrastructureStore.getBasyxComponents[componentKey].url = url

      // Test the connection
      await infrastructureStore.connectComponent(componentKey)

      // Get the connection result
      const connected = infrastructureStore.getBasyxComponents[componentKey].connected
      componentConnectionStatus.value[componentKey] = connected
    } catch {
      componentConnectionStatus.value[componentKey] = false
    } finally {
      // Restore original URL
      infrastructureStore.getBasyxComponents[componentKey].url = originalUrl
      setComponentTestingLoading(componentKey, false)
    }
  }

  /**
   * Test connection to a visible endpoint field. Grouped endpoint fields fan out to
   * their mapped internal components.
   */
  async function testEndpointField (
    template: InfrastructureTemplate,
    fieldKey: InfrastructureEndpointFieldKey,
    components: InfrastructureConfig['components'],
  ): Promise<void> {
    const endpointField = getEndpointFieldByKey(template, fieldKey)
    if (!endpointField) {
      return
    }

    const url = getEndpointFieldValue(components, endpointField)
    const testPromises = endpointField.componentKeys.map(key => testComponentConnection(key, url))
    await Promise.all(testPromises)
  }

  /**
   * Test all component connections
   */
  async function testAllConnections (
    components: InfrastructureConfig['components'],
    template: InfrastructureTemplate,
  ): Promise<void> {
    testingAllConnections.value = true
    try {
      const testPromises = getEndpointFieldsForTemplate(template).flatMap(endpointField => {
        const url = getEndpointFieldValue(components, endpointField)
        return endpointField.componentKeys.map(key => testComponentConnection(key, url))
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

import type { InfrastructureConfig } from '@/types/Infrastructure'
import type { Ref } from 'vue'

/**
 * Default header name suggested when Custom Header authentication is selected.
 */
export const DEFAULT_CUSTOM_HEADER_NAME = 'X-API-KEY'

/**
 * Composable for managing Custom Header authentication form state.
 * A static value is sent under an arbitrary header name (e.g. 'X-API-KEY').
 */
export function useCustomHeaderForm (): {
  customHeaderName: Ref<string>
  customHeaderValue: Ref<string>
  loadFromInfrastructure: (infra: InfrastructureConfig) => void
  saveToInfrastructure: (infra: InfrastructureConfig) => void
  resetForm: () => void
} {
  // Form fields
  const customHeaderName = ref<string>('')
  const customHeaderValue = ref<string>('')

  /**
   * Load Custom Header configuration from infrastructure
   */
  function loadFromInfrastructure (infra: InfrastructureConfig): void {
    const customHeader = infra.auth?.customHeader

    customHeaderName.value = customHeader?.name || ''
    customHeaderValue.value = customHeader?.value || ''
  }

  /**
   * Save Custom Header configuration to infrastructure
   */
  function saveToInfrastructure (infra: InfrastructureConfig): void {
    if (!infra.auth) {
      return
    }

    if (infra.auth.securityType === 'Custom Header') {
      infra.auth.customHeader = {
        name: customHeaderName.value || '',
        value: customHeaderValue.value || '',
      }
    }
  }

  /**
   * Reset form to initial state
   */
  function resetForm (): void {
    customHeaderName.value = ''
    customHeaderValue.value = ''
  }

  return {
    // Form fields
    customHeaderName,
    customHeaderValue,
    // Methods
    loadFromInfrastructure,
    saveToInfrastructure,
    resetForm,
  }
}

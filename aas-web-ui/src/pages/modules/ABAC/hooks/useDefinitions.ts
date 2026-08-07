import { useGetDefinition } from '@/composables/Client/ABAC/queries/definition/useGetDefinition'
import { useGetDefinitions } from '@/composables/Client/ABAC/queries/definition/useGetDefinitions'
import { useAbacNavigation } from './useAbacNavigation'

export function useDefinitions () {
  const { selectedPolicyVersion, selectedDefinitionKind, selectedDefinitionName } = useAbacNavigation()

  const queryValues = useGetDefinitions(selectedPolicyVersion)

  const { data: selectedDefinition, isLoading: isSelectedDefinitionLoading }
    = useGetDefinition(selectedPolicyVersion, selectedDefinitionKind, selectedDefinitionName)

  return {
    selectedDefinitionName,
    selectedDefinitionKind,
    definitions: queryValues.data,
    ...queryValues,
    selectedDefinition,
    isSelectedDefinitionLoading,
  }
}

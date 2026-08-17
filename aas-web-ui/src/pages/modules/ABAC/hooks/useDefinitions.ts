import { useGetDefinition } from '@/pages/modules/ABAC/api/queries/definition/useGetDefinition'
import { useGetDefinitions } from '@/pages/modules/ABAC/api/queries/definition/useGetDefinitions'
import { useAbacNavigation } from './useAbacNavigation'

export function useDefinitions () {
  const { selectedPolicyVersion, selectedDefinitionKind, selectedDefinitionName } = useAbacNavigation()

  const { data: definitions, ...rest } = useGetDefinitions(selectedPolicyVersion)

  const { data: selectedDefinition, isLoading: isSelectedDefinitionLoading }
    = useGetDefinition(selectedPolicyVersion, selectedDefinitionKind, selectedDefinitionName)

  return {
    selectedDefinitionName,
    selectedDefinitionKind,
    definitions,
    ...rest,
    selectedDefinition,
    isSelectedDefinitionLoading,
  }
}

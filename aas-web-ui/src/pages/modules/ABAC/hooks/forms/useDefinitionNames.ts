import type { DefinitionKind } from '../../types/definitions'
import { useGetDefinitions } from '../../api/definition/useGetDefinitions'
import { POLICY_FORM_CONTEXT_KEY } from '../../constants/inject'
import { useAbacNavigation } from '../navigation/useAbacNavigation'

/**
 * Reference suggestions from the enclosing policy draft, or the selected saved version when the editor is standalone.
 */
export function useDefinitionNames (kind: DefinitionKind) {
  const draft = inject(POLICY_FORM_CONTEXT_KEY, undefined)
  if (draft) {
    return computed(() => draft.definitionNames.value[kind])
  }
  const { selectedPolicyVersion } = useAbacNavigation()
  const { data: definitions } = useGetDefinitions(selectedPolicyVersion)

  return computed(() => (definitions.value?.[kind] ?? []).map(definition => definition.name))
}

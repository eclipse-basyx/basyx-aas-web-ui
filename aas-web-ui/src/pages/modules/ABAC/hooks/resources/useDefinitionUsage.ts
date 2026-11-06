import type { Definition, DefinitionKind, DefinitionUsage } from '../../types/definitions'
import type { MaybeRefOrGetter } from 'vue'
import { useGetDefinitions } from '../../api/definition/useGetDefinitions'
import { useGetRules } from '../../api/rule/useGetRules'
import { POLICY_FORM_CONTEXT_KEY } from '../../constants/inject'
import { findDefinitionReferences } from '../../utils/definitionUsage'
import { useAbacNavigation } from '../navigation/useAbacNavigation'

/**
 * Draft dependencies when a policy context is provided, otherwise references
 * in the selected saved policy version. Only
 * loaded resources yield confirmed references; unavailable data is not evidence
 * that a definition is unused. The backend's rejection stays authoritative.
 */
export function useDefinitionUsage (definition: MaybeRefOrGetter<Definition | undefined>, kind: MaybeRefOrGetter<DefinitionKind | undefined>) {
  const draft = inject(POLICY_FORM_CONTEXT_KEY, undefined)
  if (draft) {
    return { usages: computed(() => {
      const current = toValue(definition)
      const currentKind = toValue(kind)
      return current && currentKind ? draft.usagesOf(currentKind, current.name) : []
    }) }
  }
  const { selectedPolicyVersion } = useAbacNavigation()
  const { data: definitions } = useGetDefinitions(selectedPolicyVersion)
  const { data: rules } = useGetRules(selectedPolicyVersion)

  const usages = computed<DefinitionUsage[]>(() => {
    const current = toValue(definition)
    const currentKind = toValue(kind)
    return current && currentKind
      ? findDefinitionReferences(
          currentKind,
          current.name,
          definitions.value,
          rules.value,
        )
      : []
  })

  return { usages }
}

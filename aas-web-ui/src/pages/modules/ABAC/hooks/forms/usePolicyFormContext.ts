import type { DefinitionKind } from '../../types/definitions'
import type { PolicyDraft, PolicyFormContext } from '../../types/policy'
import { DEFINITION_KINDS } from '../../types/definitions'
import { policyDraftDefinitionUsage } from '../../utils/forms/policy'

/**
 * Read-only names and dependency checks from the current policy draft. The policy form
 * owns edits; nested editors never query a saved policy when this context is provided.
 */
export function usePolicyFormContext (state: () => PolicyDraft): PolicyFormContext {
  const definitionNames = computed(() => Object.fromEntries(DEFINITION_KINDS.map(kind => [
    kind,
    state().definitions.filter(entry => entry.kind === kind && typeof entry.doc.name === 'string').map(entry => entry.doc.name as string),
  ])) as Record<DefinitionKind, string[]>)

  function usagesOf (kind: DefinitionKind, name: string) {
    return policyDraftDefinitionUsage(state(), kind, name)
  }

  return { definitionNames, usagesOf }
}

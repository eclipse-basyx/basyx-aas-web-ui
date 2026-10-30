import type { DefinitionUpdate } from '../../types/definitions'
import { useMutation } from '@tanstack/vue-query'
import { detectDefinitionUpdate } from '../../utils/update'
import { useAbacContext } from '../useAbacContext'

export function useUpdateDefinition () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: async ({ versionId, kind, name, currentDefinition, payload: submitted }: DefinitionUpdate) => {
      // The dialog validation rejects name changes; use the current identity for update detection.
      const { mode, payload } = detectDefinitionUpdate(currentDefinition, { ...submitted, name: currentDefinition.name }, kind)
      if (mode === 'unchanged') {
        return
      }
      // Schema warnings do not block submission; the backend decides whether to accept the update.
      return mode === 'replace'
        ? client.replaceDefinition({ versionId, kind, name, payload })
        : client.patchDefinition({ versionId, kind, name, patch: payload })
    },
    onSuccess: (result, { versionId }) => {
      if (result) {
        invalidate(keys.definitions(versionId), keys.policies())
      }
    },
  })
}

import type { DefinitionPatch } from '../../types/definitions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function usePatchDefinition () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, kind, name, patch }: DefinitionPatch) => {
      const response = await client.patchDefinition({ versionId, kind, name, patch })
      if (!response.success) {
        throw new Error('Failed to patch ABAC definition')
      }
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.DEFINITIONS, versionId] })
    },
  })
}

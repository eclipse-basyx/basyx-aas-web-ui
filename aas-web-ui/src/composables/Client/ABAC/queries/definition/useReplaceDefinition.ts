import type { DefinitionReplace } from '../../types/definitions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useReplaceDefinition () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, kind, name, payload }: DefinitionReplace) => {
      const response = await client.replaceDefinition({ versionId, kind, name, payload })
      if (!response.success) {
        throw new Error('Failed to replace ABAC definition')
      }
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.DEFINITIONS, versionId] })
    },
  })
}

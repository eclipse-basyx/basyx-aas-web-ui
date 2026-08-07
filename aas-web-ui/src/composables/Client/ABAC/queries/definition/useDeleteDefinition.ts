import type { DefinitionDelete } from '../../types/definitions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useDeleteDefinition () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, kind, name }: DefinitionDelete) => {
      const response = await client.deleteDefinition({ versionId, kind, name })
      if (!response.success) {
        throw new Error('Failed to delete ABAC definition')
      }
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.DEFINITIONS, versionId] })
    },
  })
}

import type { DefinitionCreate } from '../../types/definitions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useCreateDefinition () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, kind, payload }: DefinitionCreate) => {
      const response = await client.createDefinition({ versionId, kind, payload })
      if (!response.success) {
        throw new Error('Failed to create ABAC definition')
      }
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.DEFINITIONS, versionId] })
    },
  })
}

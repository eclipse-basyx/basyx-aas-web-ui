import type { RuleCreate } from '../../types/rules'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useCreateRule () {
  const client = useAbacClient(false)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, payload }: RuleCreate) => {
      const response = await client.createRule({ versionId, payload })
      if (!response.success || !response.data) {
        throw new Error('Failed to create ABAC rule')
      }
      return response.data
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES, versionId] })
    },
  })
}

import type { RuleDelete } from '../../types/rules'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useDeleteRule () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, ruleIndex }: RuleDelete) => {
      const response = await client.deleteRule({ versionId, ruleIndex })
      if (!response.success) {
        throw new Error('Failed to delete ABAC rule')
      }
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES, versionId] })
    },
  })
}

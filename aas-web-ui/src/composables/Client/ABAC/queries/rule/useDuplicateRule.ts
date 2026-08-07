import type { RuleDuplicate } from '../../types/rules'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useDuplicateRule () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, ruleIndex }: RuleDuplicate) => {
      const response = await client.duplicateRule({ versionId, ruleIndex })
      if (!response.success || !response.data) {
        throw new Error('Failed to duplicate ABAC rule')
      }
      return response.data
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES, versionId] })
    },
  })
}

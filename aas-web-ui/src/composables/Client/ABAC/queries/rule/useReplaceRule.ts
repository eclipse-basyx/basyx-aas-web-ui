import type { RuleReplace } from '../../types/rules'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useReplaceRule () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, ruleIndex, rule }: RuleReplace) => {
      const response = await client.replaceRule({ versionId, ruleIndex, rule })
      if (!response.success) {
        throw new Error('Failed to replace ABAC rule')
      }
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES, versionId] })
    },
  })
}

import type { RulePatch } from '../../types/rules'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function usePatchRule () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ versionId, ruleIndex, patch }: RulePatch) => {
      const response = await client.patchRule({ versionId, ruleIndex, patch })
      if (!response.success) {
        throw new Error('Failed to patch ABAC rule')
      }
    },
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES, versionId] })
    },
  })
}

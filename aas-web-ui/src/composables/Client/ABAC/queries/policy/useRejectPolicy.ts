import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useRejectPolicy () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await client.rejectVersion(versionId)
      if (!response.success) {
        throw new Error('Failed to reject ABAC policy version')
      }
    },
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICIES] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, versionId] })
    },
  })
}

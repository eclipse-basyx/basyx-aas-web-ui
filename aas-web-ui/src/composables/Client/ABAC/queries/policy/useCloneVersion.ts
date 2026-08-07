import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useCloneVersion () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await client.cloneVersion(versionId)
      if (!response.success) {
        throw new Error('Failed to clone ABAC policy version')
      }
    },
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICIES] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, versionId] })
    },
  })
}

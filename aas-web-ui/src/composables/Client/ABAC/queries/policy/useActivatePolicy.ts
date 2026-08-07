import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ABAC_CACHE_KEYS } from '../../constants/cache'
import { useAbacClient } from '../../useAbacClient'

export function useActivatePolicy () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await client.activateVersion(versionId)
      if (!response.success || !response.data) {
        throw new Error('Failed to activate ABAC policy version')
      }
      return response.data
    },
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICIES] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, versionId] })
    },
  })
}

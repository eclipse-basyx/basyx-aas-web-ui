import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useActivatePolicy () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await client.activateVersion(versionId)
      if (!response.success || !response.data) {
        throw new Error('Failed to activate ABAC policy version')
      }
      return response.data
    },
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICIES, apiUrl.value] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, apiUrl.value, versionId] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.ACTIVE_POLICY, apiUrl.value] })
    },
  })
}

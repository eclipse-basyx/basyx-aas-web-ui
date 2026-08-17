import type { PolicyImport } from '../../../types/policy'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useImportPolicy () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  return useMutation({
    mutationFn: async (payload: PolicyImport) => {
      const response = await client.importPolicy(payload)
      if (!response.success || !response.data) {
        throw new Error('Failed to import ABAC policy')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICIES, apiUrl.value] })
    },
  })
}

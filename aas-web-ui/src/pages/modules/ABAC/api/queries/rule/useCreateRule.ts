import type { RuleCreate } from '../../../types/rules'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useCreateRule () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  return useMutation({
    mutationFn: async ({ versionId, payload }: RuleCreate) => {
      const response = await client.createRule({ versionId, payload })
      if (!response.success || !response.data) {
        throw new Error('Failed to create ABAC rule')
      }
      return response.data
    },
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES, apiUrl.value, versionId] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, apiUrl.value, versionId] })
    },
  })
}

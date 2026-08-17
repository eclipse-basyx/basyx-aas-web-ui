import type { RuleDelete } from '../../../types/rules'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useDeleteRule () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  return useMutation({
    mutationFn: async ({ versionId, ruleIndex }: RuleDelete) => {
      const response = await client.deleteRule({ versionId, ruleIndex })
      if (!response.success || !response.data) {
        throw new Error('Failed to delete ABAC rule')
      }
      return response.data
    },
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.RULES, apiUrl.value, versionId] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, apiUrl.value, versionId] })
    },
  })
}

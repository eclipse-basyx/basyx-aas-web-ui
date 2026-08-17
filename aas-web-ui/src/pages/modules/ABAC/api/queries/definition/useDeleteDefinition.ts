import type { DefinitionDelete } from '../../../types/definitions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function useDeleteDefinition () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  return useMutation({
    mutationFn: async ({ versionId, kind, name }: DefinitionDelete) => {
      const response = await client.deleteDefinition({ versionId, kind, name })
      if (!response.success || !response.data) {
        throw new Error('Failed to delete ABAC definition')
      }
      return response.data
    },
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.DEFINITIONS, apiUrl.value, versionId] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, apiUrl.value, versionId] })
    },
  })
}

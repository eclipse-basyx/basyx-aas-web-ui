import type { DefinitionPatch } from '../../../types/definitions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { ABAC_CACHE_KEYS } from '../../../constants/cache'
import { useAbacConfigStore } from '../../../stores/useAbacConfigStore'
import { useAbacClient } from '../../useAbacClient'

export function usePatchDefinition () {
  const client = useAbacClient()
  const queryClient = useQueryClient()

  const configStore = useAbacConfigStore()
  const apiUrl = computed(() => configStore.apiUrl)

  return useMutation({
    mutationFn: async ({ versionId, kind, name, patch }: DefinitionPatch) => {
      const response = await client.patchDefinition({ versionId, kind, name, patch })
      if (!response.success || !response.data) {
        throw new Error('Failed to patch ABAC definition')
      }
      return response.data
    },
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.DEFINITIONS, apiUrl.value, versionId] })
      queryClient.invalidateQueries({ queryKey: [ABAC_CACHE_KEYS.POLICY, apiUrl.value, versionId] })
    },
  })
}

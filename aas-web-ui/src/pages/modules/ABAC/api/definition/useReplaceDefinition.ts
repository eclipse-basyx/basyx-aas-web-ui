import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useReplaceDefinition () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.replaceDefinition,
    onSuccess: (_, { versionId }) => invalidate(keys.definitions(versionId), keys.policy(versionId)),
  })
}

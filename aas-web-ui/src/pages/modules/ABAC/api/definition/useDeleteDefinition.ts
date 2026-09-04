import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useDeleteDefinition () {
  const { client, invalidate, remove, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.deleteDefinition,
    onSuccess: (_, { versionId, kind, name }) => {
      invalidate(keys.definitions(versionId), keys.policy(versionId))
      remove(keys.definition(versionId, kind, name))
    },
  })
}

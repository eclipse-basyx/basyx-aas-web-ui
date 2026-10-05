import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '../useAbacContext'

export function usePatchDefinition () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.patchDefinition,
    onSuccess: (_, { versionId }) => invalidate(keys.definitions(versionId), keys.policy(versionId)),
  })
}

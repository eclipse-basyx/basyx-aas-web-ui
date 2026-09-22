import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function usePatchRule () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.patchRule,
    onSuccess: (_, { versionId }) => invalidate(keys.rules(versionId), keys.policy(versionId)),
  })
}

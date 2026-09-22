import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useMoveRule () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.moveRule,
    onSuccess: (_, { versionId }) => invalidate(keys.rules(versionId), keys.policy(versionId)),
  })
}

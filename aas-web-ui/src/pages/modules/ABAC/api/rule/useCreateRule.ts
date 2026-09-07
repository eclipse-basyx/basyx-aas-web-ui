import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '../useAbacContext'

export function useCreateRule () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.createRule,
    onSuccess: (_, { versionId }) => invalidate(keys.rules(versionId), keys.policy(versionId)),
  })
}

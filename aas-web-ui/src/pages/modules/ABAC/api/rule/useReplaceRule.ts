import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useReplaceRule () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.replaceRule,
    onSuccess: (_, { versionId }) => invalidate(keys.rules(versionId), keys.policy(versionId)),
  })
}

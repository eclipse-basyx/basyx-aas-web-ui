import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useDeleteRule () {
  const { client, invalidate, remove, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.deleteRule,
    onSuccess: (_, { versionId, ruleIndex }) => {
      invalidate(keys.rules(versionId), keys.policy(versionId))
      remove(keys.rule(versionId, ruleIndex))
    },
  })
}

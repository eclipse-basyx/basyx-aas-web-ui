import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useCloneVersion () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.cloneVersion,
    onSuccess: () => invalidate(keys.policies()),
  })
}

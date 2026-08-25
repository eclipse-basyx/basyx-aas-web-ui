import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useRejectPolicy () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.rejectVersion,
    onSuccess: () => invalidate(keys.policies()),
  })
}

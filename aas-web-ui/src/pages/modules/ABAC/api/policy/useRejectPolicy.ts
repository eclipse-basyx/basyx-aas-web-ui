import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '../useAbacContext'

export function useRejectPolicy () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.rejectVersion,
    onSuccess: () => invalidate(keys.policies()),
  })
}

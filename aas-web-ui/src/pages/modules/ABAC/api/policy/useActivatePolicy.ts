import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '../useAbacContext'

export function useActivatePolicy () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.activateVersion,
    onSuccess: () => invalidate(keys.policies()),
  })
}

import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useActivatePolicy () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.activateVersion,
    onSuccess: () => invalidate(keys.policies()),
  })
}

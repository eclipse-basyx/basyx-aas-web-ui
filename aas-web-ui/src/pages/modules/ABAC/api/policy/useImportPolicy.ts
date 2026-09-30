import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '../useAbacContext'

export function useImportPolicy () {
  const { client, invalidate, keys } = useAbacContext()

  return useMutation({
    mutationFn: client.importPolicy,
    onSuccess: () => invalidate(keys.policies()),
  })
}

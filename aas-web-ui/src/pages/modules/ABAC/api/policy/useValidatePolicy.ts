import { useMutation } from '@tanstack/vue-query'
import { useAbacContext } from '@/pages/modules/ABAC/api/useAbacContext'

export function useValidatePolicy () {
  const { client } = useAbacContext()

  return useMutation({ mutationFn: client.validateVersion })
}

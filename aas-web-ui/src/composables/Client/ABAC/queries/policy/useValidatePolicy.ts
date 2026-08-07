import { useMutation } from '@tanstack/vue-query'
import { useAbacClient } from '../../useAbacClient'

export function useValidatePolicy () {
  const client = useAbacClient()

  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await client.validateVersion(versionId)
      if (!response.success || !response.data) {
        throw new Error('Failed to validate ABAC policy version')
      }
      return response.data
    },
  })
}

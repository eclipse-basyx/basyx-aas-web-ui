import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { CACHE_KEYS } from '../constants/cache'
import { useCompanyLookupClient } from '../useCompanyLookupClient'

export function useDeleteCompany () {
  const client = useCompanyLookupClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.deleteCompanyDescriptorById(id)
      if (!response.success) {
        throw new Error('Failed to delete company')
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMPANIES] })
      queryClient.removeQueries({ queryKey: [CACHE_KEYS.COMPANY, id] })
    },
  })
}

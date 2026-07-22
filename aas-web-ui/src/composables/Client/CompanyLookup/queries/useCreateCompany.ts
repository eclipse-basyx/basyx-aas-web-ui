import type { CompanyDescriptor } from '../types/company'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { CACHE_KEYS } from '../constants/cache'
import { useCompanyLookupClient } from '../useCompanyLookupClient'

export function useCreateCompany () {
  const client = useCompanyLookupClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (descriptor: CompanyDescriptor) => {
      const response = await client.postCompanyDescriptor(descriptor)
      if (!response.success || !response.data) {
        throw new Error('Failed to create company')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMPANIES] })
    },
  })
}

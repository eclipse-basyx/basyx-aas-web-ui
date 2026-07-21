import type { CompanyDescriptor } from '../types/company'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { CACHE_KEYS } from '../constants/cache'
import { useCompanyLookupClient } from '../useCompanyLookupClient'

interface UpdateCompanyVariables {
  id: string
  descriptor: CompanyDescriptor
}

export function useUpdateCompany () {
  const client = useCompanyLookupClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, descriptor }: UpdateCompanyVariables) => {
      const response = await client.putCompanyDescriptorById(id, descriptor)
      if (!response.success || !response.data) {
        throw new Error('Failed to update company')
      }
      return response.data
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMPANIES] })
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMPANY, id] })
    },
  })
}

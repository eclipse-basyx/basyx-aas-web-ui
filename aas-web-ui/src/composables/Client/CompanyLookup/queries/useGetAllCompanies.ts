import type { CompanyLookupResponse, PagedCompanyDescriptors } from '../types/api'
import { type InfiniteData, useInfiniteQuery } from '@tanstack/vue-query'
import { computed, type Ref, unref } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { CACHE_KEYS } from '../constants/cache'
import { useCompanyLookupClient } from '../useCompanyLookupClient'

interface UseGetAllCompaniesOptions {
  name?: Ref<string | undefined> | string
  limit?: number
}

export function useGetAllCompanies (options: UseGetAllCompaniesOptions = {}) {
  const client = useCompanyLookupClient(true)

  const infrastructureStore = useInfrastructureStore()
  const companyLookupApiUrl = computed(() => infrastructureStore.getCompanyLookupURL)

  const name = computed(() => unref(options.name) || undefined)
  const limit = options.limit ?? 20

  return useInfiniteQuery<
    PagedCompanyDescriptors,
    Error,
    InfiniteData<PagedCompanyDescriptors>,
    readonly unknown[],
    string | undefined
  >({
    queryKey: computed(() => [CACHE_KEYS.COMPANIES, { name: name.value }] as const),
    enabled: computed(() => !!companyLookupApiUrl.value?.trim()),
    initialPageParam: undefined,
    queryFn: async ({ pageParam }): Promise<PagedCompanyDescriptors> => {
      const response: CompanyLookupResponse<PagedCompanyDescriptors>
        = await client.getAllCompanyDescriptors({
          limit,
          cursor: pageParam,
          name: name.value,
        })
      if (!response.success || !response.data) {
        throw new Error('Failed to load companies')
      }
      return response.data
    },
    getNextPageParam: last => last.paging_metadata?.cursor || undefined,
  })
}

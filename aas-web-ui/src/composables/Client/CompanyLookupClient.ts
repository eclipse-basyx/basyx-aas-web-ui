// import { computed } from 'vue'
// import { useRequestHandling } from '@/composables/RequestHandling'
// import { useInfrastructureStore } from '@/store/InfrastructureStore'

export function useCompanyLookupClient () {
  // Stores
  // const infrastructureStore = useInfrastructureStore()

  // Composables
  // const { getRequest, postRequest, putRequest } = useRequestHandling()

  const endpointPath = '/companies'

  // Computed Properties
  // const companyLookupUrl = computed(() => infrastructureStore.getCompanyLookupURL)

  return {
    endpointPath,
  }
}
//

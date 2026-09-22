import type { AbacService } from '@/pages/modules/ABAC/types/service'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { useQuery } from '@tanstack/vue-query'
import { useRequestHandling } from '@/composables/RequestHandling'
import { CONTEXT } from '@/pages/modules/ABAC/constants/api'
import { ABAC_CACHE_KEYS } from '@/pages/modules/ABAC/constants/cache'
import { buildAbacUrl } from '@/pages/modules/ABAC/utils/api'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { getComponentLabel } from '@/utils/InfrastructureUtils'

// Component keys that potentially expose ABAC management APIs
const DISCOVERABLE_COMPONENT_KEYS: BaSyxComponentKey[] = [
  'AASDiscovery',
  'AASRegistry',
  'SubmodelRegistry',
  'AASRepo',
  'SubmodelRepo',
  'ConceptDescriptionRepo',
]

/**
 * Discovers available ABAC services using TanStack Query.
 * Automatically refetches when the selected infrastructure changes.
 */
export function useAbacServiceDiscovery () {
  const infrastructureStore = useInfrastructureStore()
  const { getRequest } = useRequestHandling()

  const selectedInfraId = computed(() => infrastructureStore.getSelectedInfrastructureId)
  const selectedInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure)

  /**
   * Probe a single URL to check if it exposes the ABAC service.
   * Uses the policy versions endpoint as a lightweight check.
   */
  async function probeService (url: string): Promise<boolean> {
    try {
      const response = await getRequest(`${url}/policy-versions?limit=1`, CONTEXT.TEST_CONNECTION, true)
      return response.success
    } catch {
      return false
    }
  }

  return useQuery({
    queryKey: computed(() => [ABAC_CACHE_KEYS.DISCOVERY, selectedInfraId.value]),
    enabled: computed(() => !!selectedInfraId.value),
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<AbacService[]> => {
      const infra = selectedInfrastructure.value
      if (!infra) {
        return []
      }

      const seenUrls = new Set<string>()
      const candidates: Array<{ componentKey: BaSyxComponentKey, url: string }> = []

      for (const componentKey of DISCOVERABLE_COMPONENT_KEYS) {
        const componentUrl = infra.components[componentKey]?.url?.trim()
        if (!componentUrl) {
          continue
        }

        const abacUrl = buildAbacUrl(componentUrl)
        if (!abacUrl || seenUrls.has(abacUrl)) {
          continue
        }

        seenUrls.add(abacUrl)
        candidates.push({ componentKey, url: abacUrl })
      }

      const services: AbacService[] = await Promise.all(
        candidates.map(async candidate => {
          let available = false
          try {
            available = await probeService(candidate.url)
          } catch {
            // probe failed, leave available = false
          }
          return {
            name: getComponentLabel(candidate.componentKey),
            url: candidate.url,
            componentKey: candidate.componentKey,
            available,
          }
        }),
      )

      return services
    },
  })
}

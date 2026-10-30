import type { BaSyxComponentKey } from '@/types/BaSyx'
import { useInfrastructureStore } from '@/store/InfrastructureStore'

/** Components whose resources can be shared with ReBAC. */
export const resourceAccessComponents: BaSyxComponentKey[] = [
  'AASRepo', 'SubmodelRepo', 'ConceptDescriptionRepo', 'AASRegistry', 'SubmodelRegistry', 'AASDiscovery',
]

/**
 * The first component of the selected infrastructure that announces ReBAC.
 * Its `/security/rebac` root serves the repository, audit and principal
 * endpoints shared by all components of one database.
 */
export function useManagementComponent () {
  const infrastructureStore = useInfrastructureStore()

  const managementComponent = computed(() => resourceAccessComponents.find(component => infrastructureStore.supportsResourceAccess(component)))

  return { managementComponent }
}

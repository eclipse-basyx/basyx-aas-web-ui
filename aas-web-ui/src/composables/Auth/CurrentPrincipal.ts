import type { AccessPrincipal } from '@/types/ResourceAccess'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { getAccessPrincipalFromToken } from '@/utils/TokenUtil'

/** The signed-in user of the selected infrastructure as an access principal. */
export function useCurrentPrincipal () {
  const infrastructureStore = useInfrastructureStore()

  const currentPrincipal = computed<AccessPrincipal | undefined>(() => {
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    const token = infrastructure?.token?.accessToken ?? infrastructure?.auth?.bearerToken?.token
    if (!token) {
      return undefined
    }
    try {
      return getAccessPrincipalFromToken(token)
    } catch {
      return undefined
    }
  })

  return { currentPrincipal }
}

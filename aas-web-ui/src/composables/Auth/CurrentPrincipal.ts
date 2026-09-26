import type { AccessPrincipal, RebacPrincipal } from '@/types/ResourceAccess'
import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
import { useManagementComponent } from '@/composables/ResourceAccess/ManagementComponent'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { getAccessPrincipalFromToken } from '@/utils/TokenUtil'

// The identity reported by the server for the current token, shared by all
// components. It reflects the configured subject claim, e.g. `oid`.
const reported = shallowRef<{ key: string, principal?: RebacPrincipal }>()
let pending: { key: string, request: Promise<void> } | undefined

/**
 * The signed-in user of the selected infrastructure as an access principal.
 * ReBAC may identify users by another claim than `sub`, so the principal is
 * read from the server; the token only serves until it has answered.
 */
export function useCurrentPrincipal () {
  const infrastructureStore = useInfrastructureStore()
  const client = useResourceAccessClient()
  const { managementComponent } = useManagementComponent()

  const token = computed(() => {
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    return infrastructure?.token?.accessToken ?? infrastructure?.auth?.bearerToken?.token ?? ''
  })
  const requestKey = computed(() => managementComponent.value && token.value
    ? `${infrastructureStore.getSelectedInfrastructure?.id}|${managementComponent.value}|${token.value}`
    : '')
  const serverPrincipal = computed(() => reported.value?.key === requestKey.value ? reported.value.principal : undefined)
  const tokenPrincipal = computed<AccessPrincipal | undefined>(() => {
    try {
      return token.value ? getAccessPrincipalFromToken(token.value) : undefined
    } catch {
      return undefined
    }
  })

  const currentPrincipal = computed<AccessPrincipal | undefined>(() => serverPrincipal.value
    ? { type: 'user', issuer: serverPrincipal.value.issuer, subject: serverPrincipal.value.subject }
    : tokenPrincipal.value)
  const isAdministrator = computed(() => serverPrincipal.value?.administrator ?? false)

  watch(requestKey, key => {
    if (key && reported.value?.key !== key && pending?.key !== key) {
      void load(key)
    }
  }, { immediate: true })

  async function load (key: string): Promise<void> {
    const component = managementComponent.value
    if (!component) {
      return
    }
    const request = client.getPrincipal(component).then(result => {
      if (result.ok && result.data?.issuer && result.data.subject) {
        reported.value = { key, principal: result.data }
      }
    })
    pending = { key, request }
    await request
    if (pending?.key === key) {
      pending = undefined
    }
  }

  return { currentPrincipal, isAdministrator }
}

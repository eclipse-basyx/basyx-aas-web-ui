import type { InfrastructureConfig } from '@/types/Infrastructure'
import type { AccessPrincipal, RebacPrincipal } from '@/types/ResourceAccess'
import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'
import { useManagementComponent } from '@/composables/ResourceAccess/ManagementComponent'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { getAccessPrincipalFromToken } from '@/utils/TokenUtil'

// The identity reported by the server for the latest credentials, shared by
// all components. It reflects the configured subject claim, e.g. `oid`.
const reported = shallowRef<{ key: string, principal: RebacPrincipal }>()
const pending = new Set<string>()
let latestKey = ''

/**
 * The signed-in user of the selected infrastructure as an access principal.
 * ReBAC may identify users by another claim than `sub`, so the principal is
 * read from the server for every kind of authentication; a bearer token
 * only serves until the server has answered.
 */
export function useCurrentPrincipal () {
  const infrastructureStore = useInfrastructureStore()
  const client = useResourceAccessClient()
  const { managementComponent } = useManagementComponent()

  const token = computed(() => bearerToken(infrastructureStore.getSelectedInfrastructure))
  const requestKey = computed(() => {
    const infrastructure = infrastructureStore.getSelectedInfrastructure
    if (!managementComponent.value || !infrastructure || !infrastructureStore.getHasAuthenticationCredentials) {
      return ''
    }
    return `${infrastructure.id}|${managementComponent.value}|${credentialKey(infrastructure)}`
  })
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
    latestKey = key
    if (key && reported.value?.key !== key && !pending.has(key)) {
      void load(key)
    }
  }, { immediate: true })

  async function load (key: string): Promise<void> {
    const component = managementComponent.value
    if (!component) {
      return
    }
    pending.add(key)
    try {
      const result = await client.getPrincipal(component)
      // A response for earlier credentials must never replace the current one.
      if (key === latestKey && result.ok && result.data?.issuer && result.data.subject) {
        reported.value = { key, principal: result.data }
      }
    } finally {
      pending.delete(key)
    }
  }

  return { currentPrincipal, isAdministrator }
}

/** The access token sent as bearer token, if the credentials contain one. */
function bearerToken (infrastructure?: InfrastructureConfig | null): string {
  const auth = infrastructure?.auth
  if (infrastructure?.token?.accessToken) {
    return infrastructure.token.accessToken
  }
  if (auth?.securityType === 'Bearer Token') {
    return auth.bearerToken?.token.trim() ?? ''
  }
  const header = auth?.securityType === 'Custom Header' ? auth.customHeader : undefined
  if (header?.name.trim().toLowerCase() === 'authorization') {
    const [scheme, value] = header.value.trim().split(/\s+/, 2)
    return scheme?.toLowerCase() === 'bearer' ? value ?? '' : ''
  }
  return ''
}

/** Identifies the credentials, so another sign-in asks the server again. */
function credentialKey (infrastructure: InfrastructureConfig): string {
  const auth = infrastructure.auth
  return JSON.stringify([
    auth?.securityType,
    infrastructure.token?.accessToken,
    auth?.bearerToken?.token,
    auth?.customHeader?.name,
    auth?.customHeader?.value,
    auth?.basicAuth?.username,
    auth?.basicAuth?.password,
  ])
}

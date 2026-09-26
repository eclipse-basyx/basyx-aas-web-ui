import type {
  AccessDocument,
  AccessGrant,
  AccessPrincipal,
  EffectiveRights,
  GrantRelation,
  ResourceAccessResult,
  ResourceAccessTarget,
} from '@/types/ResourceAccess'
import type { Ref } from 'vue'
import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'

/**
 * Loads and changes the access of one resource. Every change is sent with
 * the ETag of the last loaded state, so concurrent changes are detected.
 */
export function useResourceAccessState (target: Ref<ResourceAccessTarget | undefined>) {
  const client = useResourceAccessClient()

  const document = ref<AccessDocument>()
  const effective = ref<EffectiveRights>()
  const etag = ref('')
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const manageable = computed(() => Boolean(document.value))

  async function load (): Promise<void> {
    if (!target.value) {
      return
    }
    loading.value = true
    error.value = ''
    const [access, rights] = await Promise.all([client.getAccess(target.value), client.getEffectiveRights(target.value)])
    loading.value = false
    loaded.value = true
    effective.value = rights.ok ? rights.data : undefined
    if (access.ok && access.data) {
      document.value = access.data
      etag.value = access.etag ?? ''
      return
    }
    document.value = undefined
    etag.value = ''
    if (access.status !== 404) {
      error.value = access.message ?? 'Access could not be loaded.'
    } else if (!rights.ok) {
      error.value = 'This resource does not exist or you have no access to it.'
    }
  }

  async function addGrant (principal: AccessPrincipal, relation: GrantRelation): Promise<boolean> {
    const grants = document.value?.grants ?? []
    if (grants.some(grant => sameGrant(grant, principal, relation))) {
      error.value = `${principal.subject} already has this role.`
      return false
    }
    return replaceGrants([...grants, { relation, subjectType: principal.type, issuer: principal.issuer, subject: principal.subject }])
  }

  async function changeRole (changed: AccessGrant, relation: GrantRelation): Promise<boolean> {
    const grants = (document.value?.grants ?? [])
      .map(grant => grant === changed ? { ...grant, relation } : grant)
      .filter((grant, index, all) => all.findIndex(other => sameGrant(other, principalOf(grant), grant.relation)) === index)
    return replaceGrants(grants)
  }

  async function removeGrant (removed: AccessGrant): Promise<boolean> {
    return replaceGrants((document.value?.grants ?? []).filter(grant => grant !== removed))
  }

  async function replaceGrants (grants: AccessGrant[]): Promise<boolean> {
    if (!target.value) {
      return false
    }
    return apply(await client.replaceGrants(target.value, grants, etag.value))
  }

  async function replaceInheritance (aasIds: string[]): Promise<boolean> {
    if (!target.value) {
      return false
    }
    return apply(await client.replaceInheritance(target.value, aasIds, etag.value))
  }

  async function apply (result: ResourceAccessResult<AccessDocument>): Promise<boolean> {
    if (!result.ok || !result.data) {
      error.value = result.message ?? 'The change could not be saved.'
      if (result.status === 412 || result.status === 404) {
        await reloadKeepingError()
      }
      return false
    }
    document.value = result.data
    etag.value = result.etag ?? etag.value
    error.value = ''
    if (target.value) {
      const rights = await client.getEffectiveRights(target.value)
      effective.value = rights.ok ? rights.data : undefined
    }
    return true
  }

  async function reloadKeepingError (): Promise<void> {
    const message = error.value
    await load()
    error.value = message
  }

  function reset (): void {
    document.value = undefined
    effective.value = undefined
    etag.value = ''
    error.value = ''
    loaded.value = false
  }

  return { document, effective, etag, loading, loaded, error, manageable, load, addGrant, changeRole, removeGrant, replaceInheritance, reset }
}

function principalOf (grant: AccessGrant): AccessPrincipal {
  return { type: grant.subjectType, issuer: grant.issuer, subject: grant.subject }
}

function sameGrant (grant: AccessGrant, principal: AccessPrincipal, relation: GrantRelation): boolean {
  return grant.relation === relation && grant.subjectType === principal.type && grant.issuer === principal.issuer && grant.subject === principal.subject
}

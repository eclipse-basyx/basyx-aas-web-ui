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
import { useBoundAccessDocument } from '@/composables/ResourceAccess/BoundAccessDocument'

const staleDocumentMessage = 'The shown access belongs to another resource. Reload and try again.'

/**
 * Loads and changes the access of one resource. Every change is sent with
 * the ETag of the last loaded state, so concurrent changes are detected.
 * Responses for a previous target or a superseded request are ignored.
 */
export function useResourceAccessState (target: Ref<ResourceAccessTarget | undefined>) {
  const client = useResourceAccessClient()
  const bound = useBoundAccessDocument()

  const effective = ref<EffectiveRights>()
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const manageable = computed(() => Boolean(bound.document.value))

  async function load (): Promise<void> {
    const requested = target.value
    if (!requested) {
      return
    }
    const request = bound.begin()
    loading.value = true
    error.value = ''
    const [access, rights] = await Promise.all([client.getAccess(requested), client.getEffectiveRights(requested)])
    if (!bound.isLatest(request)) {
      return
    }
    loading.value = false
    loaded.value = true
    effective.value = rights.ok ? rights.data : undefined
    const document = access.ok ? access.data : undefined
    bound.accept(request, requested.endpoint, document, access.etag ?? '')
    if (document) {
      return
    }
    if (access.status !== 404) {
      error.value = access.message ?? 'Access could not be loaded.'
    } else if (!rights.ok) {
      error.value = 'This resource does not exist or you have no access to it.'
    }
  }

  async function addGrant (principal: AccessPrincipal, relation: GrantRelation): Promise<boolean> {
    const grants = bound.document.value?.grants ?? []
    if (grants.some(grant => sameGrant(grant, principal, relation))) {
      error.value = `${principal.subject} already has this role.`
      return false
    }
    return replaceGrants([...grants, { relation, subjectType: principal.type, issuer: principal.issuer, subject: principal.subject }])
  }

  async function changeRole (changed: AccessGrant, relation: GrantRelation): Promise<boolean> {
    const grants = (bound.document.value?.grants ?? [])
      .map(grant => grant === changed ? { ...grant, relation } : grant)
      .filter((grant, index, all) => all.findIndex(other => sameGrant(other, principalOf(grant), grant.relation)) === index)
    return replaceGrants(grants)
  }

  async function removeGrant (removed: AccessGrant): Promise<boolean> {
    return replaceGrants((bound.document.value?.grants ?? []).filter(grant => grant !== removed))
  }

  async function replaceGrants (grants: AccessGrant[]): Promise<boolean> {
    return change(requested => client.replaceGrants(requested, grants, bound.etag.value))
  }

  async function replaceInheritance (aasIds: string[]): Promise<boolean> {
    return change(requested => client.replaceInheritance(requested, aasIds, bound.etag.value))
  }

  /** Sends a change of the loaded document's own resource. */
  async function change (send: (requested: ResourceAccessTarget) => Promise<ResourceAccessResult<AccessDocument>>): Promise<boolean> {
    const requested = target.value
    if (!requested || !bound.boundTo(requested.endpoint)) {
      error.value = staleDocumentMessage
      return false
    }
    const request = bound.begin()
    const result = await send(requested)
    if (!bound.isLatest(request)) {
      return false
    }
    if (!result.ok || !result.data) {
      error.value = result.message ?? 'The change could not be saved.'
      if (result.status === 412 || result.status === 404) {
        await reloadKeepingError()
      }
      return false
    }
    bound.accept(request, requested.endpoint, result.data, result.etag ?? bound.etag.value)
    error.value = ''
    const rights = await client.getEffectiveRights(requested)
    if (bound.isLatest(request)) {
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
    bound.clear()
    effective.value = undefined
    error.value = ''
    loading.value = false
    loaded.value = false
  }

  return {
    document: bound.document,
    effective,
    etag: bound.etag,
    loading,
    loaded,
    error,
    manageable,
    load,
    addGrant,
    changeRole,
    removeGrant,
    replaceInheritance,
    reset,
  }
}

function principalOf (grant: AccessGrant): AccessPrincipal {
  return { type: grant.subjectType, issuer: grant.issuer, subject: grant.subject }
}

function sameGrant (grant: AccessGrant, principal: AccessPrincipal, relation: GrantRelation): boolean {
  return grant.relation === relation && grant.subjectType === principal.type && grant.issuer === principal.issuer && grant.subject === principal.subject
}

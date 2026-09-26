import type { RequestResult } from '@/composables/RequestHandling'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import type {
  AccessDocument,
  AccessGrant,
  AuditListQuery,
  AuditPage,
  AuditRange,
  AuditVerification,
  EffectiveRights,
  Invitation,
  InvitationRequest,
  RebacPrincipal,
  ReconcileReport,
  RepositoryKind,
  ResourceAccessResult,
  ResourceAccessTarget,
} from '@/types/ResourceAccess'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { accessEndpoint } from '@/utils/ResourceAccessTargets'
import { managementUrl } from '@/utils/ShareLinks'

const expectedStatuses = [400, 404, 409, 412, 428, 503]

const statusMessages: Record<number, string> = {
  400: 'The access change is invalid.',
  401: 'Please sign in before managing access.',
  403: 'You are not allowed to manage access here.',
  404: 'Only owners and administrators can manage access to this resource.',
  409: 'The change was rejected, for example because the last owner would be removed.',
  412: 'Access was changed by someone else. The latest state has been loaded; review and retry.',
  428: 'The access version is missing. Reload and retry.',
  503: 'Access management is currently unavailable. Please try again later.',
}

/**
 * Client for the relationship-based access control (ReBAC) management API
 * of BaSyx: `$access` sub-resources of individual resources, repository
 * grants and the administrator endpoints below `/security/rebac`.
 */
export function useResourceAccessClient () {
  const infrastructureStore = useInfrastructureStore()
  const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling()

  async function getAccess (target: ResourceAccessTarget): Promise<ResourceAccessResult<AccessDocument>> {
    return read<AccessDocument>(target, accessEndpoint(target), 'loading access')
  }

  async function replaceGrants (target: ResourceAccessTarget, grants: AccessGrant[], etag: string): Promise<ResourceAccessResult<AccessDocument>> {
    return write<AccessDocument>(target, 'put', `${accessEndpoint(target)}/grants`, { grants: withoutMetadata(grants) }, etag)
  }

  async function getEffectiveRights (target: ResourceAccessTarget): Promise<ResourceAccessResult<EffectiveRights>> {
    return read<EffectiveRights>(target, `${accessEndpoint(target)}/effective`, 'loading your access')
  }

  async function replaceInheritance (target: ResourceAccessTarget, aasIds: string[], etag: string): Promise<ResourceAccessResult<AccessDocument>> {
    return write<AccessDocument>(target, 'put', `${accessEndpoint(target)}/inheritance`, { aasIds }, etag)
  }

  async function listInvitations (target: ResourceAccessTarget): Promise<ResourceAccessResult<Invitation[]>> {
    const result = await read<{ invitations: Invitation[] }>(target, `${accessEndpoint(target)}/invitations`, 'loading invitations')
    return { ...result, data: result.data?.invitations }
  }

  async function createInvitation (target: ResourceAccessTarget, invitation: InvitationRequest): Promise<ResourceAccessResult<Invitation>> {
    return write<Invitation>(target, 'post', `${accessEndpoint(target)}/invitations`, invitation)
  }

  async function revokeInvitation (target: ResourceAccessTarget, invitationId: string): Promise<ResourceAccessResult> {
    return write(target, 'delete', `${accessEndpoint(target)}/invitations/${encodeURIComponent(invitationId)}`)
  }

  async function getRepositoryAccess (component: BaSyxComponentKey, kind: RepositoryKind): Promise<ResourceAccessResult<AccessDocument>> {
    return readManagement<AccessDocument>(component, `/repositories/${kind}/$access`, 'loading repository access')
  }

  async function replaceRepositoryGrants (component: BaSyxComponentKey, kind: RepositoryKind, grants: AccessGrant[], etag: string): Promise<ResourceAccessResult<AccessDocument>> {
    const url = componentManagementUrl(component)
    if (!url) {
      return unavailable()
    }
    return send<AccessDocument>('put', `${url}/repositories/${kind}/$access/grants`, { grants: withoutMetadata(grants) }, etag)
  }

  async function listAudit (component: BaSyxComponentKey, query: AuditListQuery = {}): Promise<ResourceAccessResult<AuditPage>> {
    return readManagement<AuditPage>(component, `/admin/audit${queryString(query)}`, 'loading the audit trail')
  }

  async function verifyAudit (component: BaSyxComponentKey, range: AuditRange = {}): Promise<ResourceAccessResult<AuditVerification>> {
    return readManagement<AuditVerification>(component, `/admin/audit/verify${queryString(range)}`, 'verifying the audit trail')
  }

  async function getPrincipal (component: BaSyxComponentKey): Promise<ResourceAccessResult<RebacPrincipal>> {
    return readManagement<RebacPrincipal>(component, '/principal', 'loading your user ID')
  }

  async function reconcile (component: BaSyxComponentKey): Promise<ResourceAccessResult<ReconcileReport>> {
    const url = componentManagementUrl(component)
    if (!url) {
      return unavailable()
    }
    return send<ReconcileReport>('post', `${url}/admin/reconcile`)
  }

  async function read<T> (target: ResourceAccessTarget, url: string, context: string): Promise<ResourceAccessResult<T>> {
    if (!infrastructureStore.supportsResourceAccess(target.componentKey, target.endpoint)) {
      return unavailable()
    }
    const result = await getRequest(url, context, true, new Headers(), { suppressStatuses: expectedStatuses }) as RequestResult<T>
    return normalizeResult(result)
  }

  async function readManagement<T> (component: BaSyxComponentKey, path: string, context: string): Promise<ResourceAccessResult<T>> {
    const url = componentManagementUrl(component)
    if (!url) {
      return unavailable()
    }
    const result = await getRequest(`${url}${path}`, context, true, new Headers(), { suppressStatuses: expectedStatuses }) as RequestResult<T>
    return normalizeResult(result)
  }

  async function write<T> (target: ResourceAccessTarget, method: 'post' | 'put' | 'delete', url: string, body?: unknown, etag?: string): Promise<ResourceAccessResult<T>> {
    if (!infrastructureStore.supportsResourceAccess(target.componentKey, target.endpoint)) {
      return unavailable()
    }
    return send<T>(method, url, body, etag)
  }

  async function send<T> (method: 'post' | 'put' | 'delete', url: string, body?: unknown, etag?: string): Promise<ResourceAccessResult<T>> {
    const headers = new Headers()
    if (etag !== undefined) {
      if (!etag.trim()) {
        return { ok: false, status: 428, message: statusMessages[428] }
      }
      headers.set('If-Match', etag)
    }
    const options = { suppressStatuses: expectedStatuses }
    let result: RequestResult<T>
    if (method === 'delete') {
      result = await deleteRequest(url, headers, 'updating access', true, options)
    } else {
      headers.set('Content-Type', 'application/json')
      const payload = JSON.stringify(body ?? {})
      result = method === 'post'
        ? await postRequest(url, payload, headers, 'updating access', true, false, options)
        : await putRequest(url, payload, headers, 'updating access', true, options)
    }
    return normalizeResult(result)
  }

  function componentManagementUrl (component: BaSyxComponentKey): string | undefined {
    if (!infrastructureStore.supportsResourceAccess(component)) {
      return undefined
    }
    const configured = infrastructureStore.getSelectedInfrastructure?.components[component]?.url
    if (!configured) {
      return undefined
    }
    try {
      return managementUrl(configured, component)
    } catch {
      return undefined
    }
  }

  return {
    getAccess,
    replaceGrants,
    getEffectiveRights,
    replaceInheritance,
    listInvitations,
    createInvitation,
    revokeInvitation,
    getRepositoryAccess,
    replaceRepositoryGrants,
    listAudit,
    verifyAudit,
    getPrincipal,
    reconcile,
  }
}

function withoutMetadata (grants: AccessGrant[]): AccessGrant[] {
  return grants.map(({ relation, subjectType, issuer, subject }) => ({ relation, subjectType, issuer, subject }))
}

function normalizeResult<T> (result: RequestResult<T>): ResourceAccessResult<T> {
  const status = result.status ?? result.raw?.status
  if (!result.success) {
    return { ok: false, status, message: status ? statusMessages[status] ?? `Access request failed (${status}).` : 'Access request failed.' }
  }
  return {
    ok: true,
    data: result.data,
    status,
    etag: result.raw?.headers.get('ETag') ?? undefined,
  }
}

/** Builds a query string from the set, non-empty parameters. */
function queryString (parameters: object): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(parameters)) {
    const text = typeof value === 'string' ? value.trim() : (value === undefined ? '' : String(value))
    if (text) {
      query.set(key, text)
    }
  }
  const encoded = query.toString()
  return encoded ? `?${encoded}` : ''
}

function unavailable<T> (): ResourceAccessResult<T> {
  return { ok: false, message: 'Sharing is not available for this resource.' }
}

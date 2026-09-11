import type { RequestResult } from '@/composables/RequestHandling'
import type {
  AccessPrincipal,
  GrantInput,
  ManagedGrant,
  ResourceAccessOverview,
  ResourceAccessResult,
  ResourceAccessTarget,
  ResourceBoundPolicy,
  ShareLinkInput,
  ShareLinkResponse,
} from '@/types/ResourceAccess'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { accessEndpoint } from '@/utils/ResourceAccessTargets'

const expectedStatuses = [400, 401, 403, 404, 405, 409, 412, 413, 428]

const statusMessages: Record<number, string> = {
  400: 'The access configuration is invalid.',
  401: 'Please sign in before managing access.',
  403: 'Only an owner or manager may administer this resource.',
  404: 'The resource or access entry no longer exists.',
  405: 'This access operation is not supported by the component.',
  409: 'Create a local policy before changing grants or managers.',
  412: 'Access was changed by someone else. The latest version has been loaded; review and retry.',
  413: 'The policy is larger than the 1 MiB limit.',
  428: 'The access version is missing. Reload the resource and retry.',
}

export function useResourceAccessClient () {
  const infrastructureStore = useInfrastructureStore()
  const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling()

  async function getOverview (target: ResourceAccessTarget): Promise<ResourceAccessResult<ResourceAccessOverview>> {
    if (!infrastructureStore.supportsResourceAccess?.(target.componentKey, target.endpoint)) {
      return unavailable()
    }
    const result = await getRequest(
      accessEndpoint(target),
      'loading resource access',
      true,
      new Headers(),
      { suppressStatuses: expectedStatuses },
    ) as RequestResult<ResourceAccessOverview>
    return normalizeResult(result)
  }

  async function putPolicy (
    target: ResourceAccessTarget,
    policy: ResourceBoundPolicy,
    etag: string,
  ): Promise<ResourceAccessResult<ResourceBoundPolicy>> {
    return mutate<ResourceBoundPolicy>('put', `${accessEndpoint(target)}/policy`, policy, etag)
  }

  async function deletePolicy (target: ResourceAccessTarget, etag: string): Promise<ResourceAccessResult> {
    return mutate('delete', `${accessEndpoint(target)}/policy`, undefined, etag)
  }

  async function createGrant (
    target: ResourceAccessTarget,
    grant: GrantInput,
    etag: string,
  ): Promise<ResourceAccessResult<ManagedGrant>> {
    return mutate<ManagedGrant>('post', `${accessEndpoint(target)}/grants`, grant, etag)
  }

  async function createShareLink (target: ResourceAccessTarget, input: ShareLinkInput, etag: string): Promise<ResourceAccessResult<ShareLinkResponse>> {
    return mutate('post', `${accessEndpoint(target)}/share-links`, input, etag)
  }

  async function revokeShareLink (target: ResourceAccessTarget, id: string, etag: string): Promise<ResourceAccessResult> {
    return mutate('delete', `${accessEndpoint(target)}/share-links/${encodeURIComponent(id)}`, undefined, etag)
  }

  async function updateGrant (
    target: ResourceAccessTarget,
    grantId: string,
    grant: GrantInput,
    etag: string,
  ): Promise<ResourceAccessResult<ManagedGrant>> {
    return mutate<ManagedGrant>('put', `${accessEndpoint(target)}/grants/${encodeURIComponent(grantId)}`, grant, etag)
  }

  async function deleteGrant (
    target: ResourceAccessTarget,
    grantId: string,
    etag: string,
  ): Promise<ResourceAccessResult> {
    return mutate('delete', `${accessEndpoint(target)}/grants/${encodeURIComponent(grantId)}`, undefined, etag)
  }

  async function replaceOwners (
    target: ResourceAccessTarget,
    principals: AccessPrincipal[],
    etag: string,
  ): Promise<ResourceAccessResult<AccessPrincipal[]>> {
    if (principals.length === 0) {
      return { ok: false, status: 400, message: 'At least one owner must remain.' }
    }
    return mutate<AccessPrincipal[]>('put', `${accessEndpoint(target)}/owners`, principals, etag)
  }

  async function replaceManagers (
    target: ResourceAccessTarget,
    principals: AccessPrincipal[],
    etag: string,
  ): Promise<ResourceAccessResult<AccessPrincipal[]>> {
    return mutate<AccessPrincipal[]>('put', `${accessEndpoint(target)}/managers`, principals, etag)
  }

  async function mutate<T> (
    method: 'post' | 'put' | 'delete',
    path: string,
    value: unknown,
    etag: string,
  ): Promise<ResourceAccessResult<T>> {
    if (!infrastructureStore.supportsResourceAccessEndpoint?.(path.split('/$access', 1)[0])) {
      return unavailable()
    }
    if (!etag.trim()) {
      return { ok: false, status: 428, message: statusMessages[428] }
    }
    const headers = new Headers({ 'If-Match': etag })
    let result: RequestResult<T>

    if (method === 'delete') {
      result = await deleteRequest(path, headers, 'updating resource access', true, {
        suppressStatuses: expectedStatuses,
      })
    } else {
      headers.set('Content-Type', 'application/json')
      const body = JSON.stringify(value)
      result = method === 'post'
        ? await postRequest(path, body, headers, 'updating resource access', true, false, {
            suppressStatuses: expectedStatuses,
          })
        : await putRequest(path, body, headers, 'updating resource access', true, {
            suppressStatuses: expectedStatuses,
          })
    }
    return normalizeResult(result)
  }

  return {
    getOverview,
    createShareLink,
    revokeShareLink,
    putPolicy,
    deletePolicy,
    createGrant,
    updateGrant,
    deleteGrant,
    replaceOwners,
    replaceManagers,
  }
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
    location: result.raw?.headers.get('Location') ?? undefined,
  }
}

function unavailable<T> (): ResourceAccessResult<T> {
  return { ok: false, message: 'Sharing is not available for this resource.' }
}

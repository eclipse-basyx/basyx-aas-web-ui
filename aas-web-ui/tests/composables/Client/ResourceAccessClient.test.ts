import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useResourceAccessClient } from '@/composables/Client/ResourceAccessClient'

const requests = vi.hoisted(() => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
  putRequest: vi.fn(),
  deleteRequest: vi.fn(),
}))

vi.mock('@/composables/RequestHandling', () => ({ useRequestHandling: () => requests }))

const profiles = vi.hoisted(() => ({ enabled: true }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({
  supportsResourceAccess: () => profiles.enabled,
  supportsResourceAccessEndpoint: () => profiles.enabled,
}) }))

const target = {
  kind: 'aas' as const,
  label: 'AAS',
  endpoint: 'https://host/shells/YWFz',
  componentKey: 'AASRepo' as const,
}

describe('ResourceAccessClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profiles.enabled = true
  })

  it('does not send any access requests without the advertised profile', async () => {
    profiles.enabled = false
    const client = useResourceAccessClient()
    expect((await client.getOverview(target)).ok).toBe(false)
    expect((await client.createGrant(target, { principal: { issuer: 'issuer', subject: 'user' }, rights: ['READ'] }, 'etag')).ok).toBe(false)
    expect((await client.deletePolicy(target, 'etag')).ok).toBe(false)
    expect(requests.getRequest).not.toHaveBeenCalled()
    expect(requests.postRequest).not.toHaveBeenCalled()
    expect(requests.deleteRequest).not.toHaveBeenCalled()
  })

  it('creates and revokes invitations with the current access version', async () => {
    requests.postRequest.mockResolvedValue({ success: true, data: { id: 'link-id' } })
    requests.deleteRequest.mockResolvedValue({ success: true })
    const client = useResourceAccessClient()
    await client.createShareLink(target, { rights: ['READ'], expiresInSeconds: 3600 }, 'etag')
    expect(requests.postRequest.mock.calls[0][0]).toBe('https://host/shells/YWFz/$access/share-links')
    expect(requests.postRequest.mock.calls[0][2].get('If-Match')).toBe('etag')
    await client.revokeShareLink(target, 'link-id', 'etag')
    expect(requests.deleteRequest.mock.calls[0][0]).toBe('https://host/shells/YWFz/$access/share-links/link-id')
    expect(requests.deleteRequest.mock.calls[0][1].get('If-Match')).toBe('etag')
    profiles.enabled = false
    await client.createShareLink(target, { rights: ['READ'], expiresInSeconds: 3600 }, 'etag')
    expect(requests.postRequest).toHaveBeenCalledTimes(1)
  })

  it('reads the overview and returns its ETag', async () => {
    requests.getRequest.mockResolvedValue({
      success: true,
      status: 200,
      data: { revision: 1 },
      raw: new Response('', { headers: { ETag: '"revision-1"' } }),
    })
    const result = await useResourceAccessClient().getOverview(target)
    expect(requests.getRequest).toHaveBeenCalledWith(
      'https://host/shells/YWFz/$access',
      'loading resource access',
      true,
      expect.any(Headers),
      expect.objectContaining({ suppressStatuses: expect.arrayContaining([412, 428]) }),
    )
    expect(result.etag).toBe('"revision-1"')
  })

  it('sends If-Match for grant mutations and returns Location', async () => {
    requests.postRequest.mockImplementation((_path, _body, headers) => Promise.resolve({
      success: true,
      status: 201,
      data: { id: 'grant-1' },
      raw: new Response('', { headers: { ETag: '"revision-2"', Location: '/grants/grant-1' } }),
      sentEtag: headers.get('If-Match'),
    }))
    const result = await useResourceAccessClient().createGrant(target, {
      principal: { issuer: 'issuer', subject: 'reader' },
      rights: ['READ'],
    }, '"revision-1"')
    const [, body, headers] = requests.postRequest.mock.calls[0]
    expect(JSON.parse(body)).toEqual({ principal: { issuer: 'issuer', subject: 'reader' }, rights: ['READ'] })
    expect(headers.get('If-Match')).toBe('"revision-1"')
    expect(result.location).toBe('/grants/grant-1')
  })

  it('preserves group type when creating, editing and assigning administration', async () => {
    requests.postRequest.mockResolvedValue({ success: true })
    requests.putRequest.mockResolvedValue({ success: true })
    const client = useResourceAccessClient()
    const principal = { type: 'group' as const, issuer: 'https://issuer', subject: '/engineering' }
    const grant = { principal, rights: ['READ' as const] }
    await client.createGrant(target, grant, '"revision-1"')
    expect(JSON.parse(requests.postRequest.mock.calls[0][1])).toEqual(grant)
    await client.updateGrant(target, 'group-grant', grant, '"revision-2"')
    expect(JSON.parse(requests.putRequest.mock.calls[0][1])).toEqual(grant)
    await client.replaceOwners(target, [principal], '"revision-3"')
    await client.replaceManagers(target, [principal], '"revision-4"')
    expect(JSON.parse(requests.putRequest.mock.calls[1][1])).toEqual([principal])
    expect(JSON.parse(requests.putRequest.mock.calls[2][1])).toEqual([principal])
  })

  it('fails locally when ETag or owners are missing', async () => {
    const client = useResourceAccessClient()
    expect((await client.deletePolicy(target, '')).status).toBe(428)
    expect((await client.replaceOwners(target, [], '"revision-1"')).message).toContain('owner')
    expect(requests.putRequest).not.toHaveBeenCalled()
  })

  it('maps stale updates to a reviewable message', async () => {
    requests.putRequest.mockResolvedValue({ success: false, status: 412, raw: new Response('', { status: 412 }) })
    const result = await useResourceAccessClient().replaceManagers(target, [], '"revision-1"')
    expect(result.ok).toBe(false)
    expect(result.message).toContain('review and retry')
  })
})

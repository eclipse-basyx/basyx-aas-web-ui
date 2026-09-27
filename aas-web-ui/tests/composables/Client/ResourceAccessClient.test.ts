import type { AccessGrant } from '@/types/ResourceAccess'
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
  getSelectedInfrastructure: { components: { AASRepo: { url: 'https://host/api/shells' } } },
}) }))

const target = {
  kind: 'aas' as const,
  label: 'AAS',
  endpoint: 'https://host/api/shells/YWFz',
  componentKey: 'AASRepo' as const,
}

const grant: AccessGrant = {
  relation: 'viewer',
  subjectType: 'group',
  issuer: 'https://issuer',
  subject: 'team',
  createdBy: 'user:a.b',
  createdAt: '2026-01-01T00:00:00Z',
}

function response (data: unknown, etag = '"7"', status = 200) {
  return { success: true, status, data, raw: { status, headers: new Headers({ ETag: etag }) } }
}

describe('ResourceAccessClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profiles.enabled = true
  })

  it('does not send any access requests without the advertised profile', async () => {
    profiles.enabled = false
    const client = useResourceAccessClient()
    expect((await client.getAccess(target)).ok).toBe(false)
    expect((await client.replaceGrants(target, [grant], '"1"')).ok).toBe(false)
    expect((await client.getRepositoryAccess('AASRepo', 'aas')).ok).toBe(false)
    expect((await client.listAudit('AASRepo')).ok).toBe(false)
    expect(requests.getRequest).not.toHaveBeenCalled()
    expect(requests.putRequest).not.toHaveBeenCalled()
  })

  it('reads the access document with its ETag', async () => {
    requests.getRequest.mockResolvedValue(response({ object: { type: 'aas', id: 'aas' }, revision: 7, grants: [grant] }))
    const result = await useResourceAccessClient().getAccess(target)
    expect(result).toMatchObject({ ok: true, etag: '"7"', data: { revision: 7 } })
    expect(requests.getRequest).toHaveBeenCalledWith(
      'https://host/api/shells/YWFz/$access', 'loading access', true, expect.any(Headers), expect.any(Object),
    )
  })

  it('replaces grants with If-Match and without server metadata', async () => {
    requests.putRequest.mockResolvedValue(response({ grants: [grant] }, '"8"'))
    const result = await useResourceAccessClient().replaceGrants(target, [grant], '"7"')
    expect(result.etag).toBe('"8"')
    const [url, body, headers] = requests.putRequest.mock.calls[0]!
    expect(url).toBe('https://host/api/shells/YWFz/$access/grants')
    expect(JSON.parse(body)).toEqual({ grants: [{ relation: 'viewer', subjectType: 'group', issuer: 'https://issuer', subject: 'team' }] })
    expect(headers.get('If-Match')).toBe('"7"')
  })

  it('fails locally when the access version is missing', async () => {
    const result = await useResourceAccessClient().replaceInheritance(target, ['aas'], ' ')
    expect(result).toMatchObject({ ok: false, status: 428 })
    expect(requests.putRequest).not.toHaveBeenCalled()
  })

  it('maps stale updates to a reviewable message', async () => {
    requests.putRequest.mockResolvedValue({ success: false, status: 412 })
    const result = await useResourceAccessClient().replaceGrants(target, [], '"1"')
    expect(result.message).toContain('changed by someone else')
  })

  it('creates, lists and revokes invitations of a resource', async () => {
    const client = useResourceAccessClient()
    requests.postRequest.mockResolvedValue(response({ id: 'i/1', token: 't' }))
    requests.getRequest.mockResolvedValue(response({ invitations: [{ id: 'i/1' }] }))
    requests.deleteRequest.mockResolvedValue({ success: true, status: 204 })
    expect((await client.createInvitation(target, { relation: 'viewer', expiresAt: '2026-01-02T00:00:00Z', maxUses: 1 })).data?.token).toBe('t')
    expect((await client.listInvitations(target)).data).toEqual([{ id: 'i/1' }])
    expect((await client.revokeInvitation(target, 'i/1')).ok).toBe(true)
    expect(requests.postRequest.mock.calls[0]![0]).toBe('https://host/api/shells/YWFz/$access/invitations')
    expect(requests.deleteRequest.mock.calls[0]![0]).toBe('https://host/api/shells/YWFz/$access/invitations/i%2F1')
  })

  it('addresses repository grants and administration below the management root', async () => {
    const client = useResourceAccessClient()
    requests.getRequest.mockResolvedValue(response({ events: [], hasMore: false }))
    requests.putRequest.mockResolvedValue(response({ grants: [] }))
    await client.getRepositoryAccess('AASRepo', 'aas')
    await client.replaceRepositoryGrants('AASRepo', 'aas', [], '"1"')
    await client.listAudit('AASRepo', { objectType: 'element', objectId: 'urn:sm', idShortPath: 'a[0]', actorSubject: ' ', beforeId: 10, limit: 20 })
    await client.verifyAudit('AASRepo', { afterId: 7, afterHash: 'hash', expectedHead: ' head ', limit: 1000 })
    await client.getPrincipal('AASRepo')
    expect(requests.getRequest.mock.calls.map(call => call[0])).toEqual([
      'https://host/api/security/rebac/repositories/aas/$access',
      'https://host/api/security/rebac/admin/audit?objectType=element&objectId=urn%3Asm&idShortPath=a%5B0%5D&beforeId=10&limit=20',
      'https://host/api/security/rebac/admin/audit/verify?afterId=7&afterHash=hash&expectedHead=head&limit=1000',
      'https://host/api/security/rebac/principal',
    ])
    expect(requests.putRequest.mock.calls[0]![0]).toBe('https://host/api/security/rebac/repositories/aas/$access/grants')
  })
})

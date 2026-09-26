import type { AccessGrant } from '@/types/ResourceAccess'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useResourceAccessState } from '@/composables/ResourceAccess/ResourceAccessState'

const client = vi.hoisted(() => ({
  getAccess: vi.fn(),
  getEffectiveRights: vi.fn(),
  replaceGrants: vi.fn(),
  replaceInheritance: vi.fn(),
}))

vi.mock('@/composables/Client/ResourceAccessClient', () => ({ useResourceAccessClient: () => client }))

const target = ref({
  kind: 'submodel' as const,
  label: 'Submodel',
  endpoint: 'https://host/submodels/c20',
  componentKey: 'SubmodelRepo' as const,
})

const owner: AccessGrant = { relation: 'owner', subjectType: 'user', issuer: 'https://issuer', subject: 'alice' }
const viewer: AccessGrant = { relation: 'viewer', subjectType: 'user', issuer: 'https://issuer', subject: 'bob' }
const bob = { type: 'user' as const, issuer: 'https://issuer', subject: 'bob' }

function document (grants: AccessGrant[], revision = 1) {
  return { object: { type: 'submodel', id: 'sm' }, revision, grants }
}

describe('ResourceAccessState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.getAccess.mockResolvedValue({ ok: true, data: document([owner]), etag: '"1"' })
    client.getEffectiveRights.mockResolvedValue({ ok: true, data: { object: { type: 'submodel', id: 'sm' }, rights: [] } })
  })

  it('loads the access document together with the effective rights', async () => {
    const state = useResourceAccessState(target)
    await state.load()
    expect(state.manageable.value).toBe(true)
    expect(state.etag.value).toBe('"1"')
    expect(state.effective.value?.object.id).toBe('sm')
  })

  it('treats a hidden access document as not manageable without an error', async () => {
    client.getAccess.mockResolvedValue({ ok: false, status: 404 })
    const state = useResourceAccessState(target)
    await state.load()
    expect(state.manageable.value).toBe(false)
    expect(state.error.value).toBe('')
  })

  it('adds grants with the loaded ETag and rejects duplicates locally', async () => {
    client.replaceGrants.mockResolvedValue({ ok: true, data: document([owner, viewer], 2), etag: '"2"' })
    const state = useResourceAccessState(target)
    await state.load()
    expect(await state.addGrant(bob, 'viewer')).toBe(true)
    expect(client.replaceGrants).toHaveBeenCalledWith(target.value, [owner, viewer], '"1"')
    expect(state.etag.value).toBe('"2"')
    expect(await state.addGrant(bob, 'viewer')).toBe(false)
    expect(client.replaceGrants).toHaveBeenCalledTimes(1)
  })

  it('merges a role change into an existing identical grant', async () => {
    const editor: AccessGrant = { ...viewer, relation: 'editor' }
    client.getAccess.mockResolvedValue({ ok: true, data: document([owner, viewer, editor]), etag: '"1"' })
    client.replaceGrants.mockResolvedValue({ ok: true, data: document([owner, editor], 2), etag: '"2"' })
    const state = useResourceAccessState(target)
    await state.load()
    await state.changeRole(state.document.value!.grants[1]!, 'editor')
    expect(client.replaceGrants).toHaveBeenCalledWith(target.value, [owner, editor], '"1"')
  })

  it('reloads after a concurrent change and keeps the conflict visible', async () => {
    client.replaceInheritance.mockResolvedValue({ ok: false, status: 412, message: 'Access was changed by someone else.' })
    const state = useResourceAccessState(target)
    await state.load()
    client.getAccess.mockResolvedValue({ ok: true, data: document([owner], 3), etag: '"3"' })
    expect(await state.replaceInheritance(['aas'])).toBe(false)
    expect(state.etag.value).toBe('"3"')
    expect(state.error.value).toBe('Access was changed by someone else.')
  })

  it('reset clears the loaded state', async () => {
    const state = useResourceAccessState(target)
    await state.load()
    state.reset()
    expect(state.loaded.value).toBe(false)
    expect(state.document.value).toBeUndefined()
    expect(state.etag.value).toBe('')
  })
})

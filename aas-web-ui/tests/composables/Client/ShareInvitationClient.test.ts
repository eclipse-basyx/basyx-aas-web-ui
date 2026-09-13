import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useShareInvitationClient } from '@/composables/Client/ShareInvitationClient'

const mocks = vi.hoisted(() => ({ post: vi.fn(), profile: true, authenticated: true }))
vi.mock('@/composables/RequestHandling', () => ({ useRequestHandling: () => ({ postRequest: mocks.post }) }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({
  getSelectedInfrastructure: { components: { AASRepo: { url: 'https://api.example/prefix/shells' } } },
  supportsResourceAccess: () => mocks.profile,
  get getHasAuthenticationCredentials () {
    return mocks.authenticated
  },
}) }))
const invitation = { token: 'a'.repeat(43), service: 'https://api.example/prefix', component: 'AASRepo' as const, receivedAt: Date.now() }

describe('Invitation redemption', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.profile = true
    mocks.authenticated = true
  })
  it('sends only the token in the body to the configured service', async () => {
    mocks.post.mockResolvedValue({ success: true, status: 201 })
    expect((await useShareInvitationClient().redeem(invitation)).ok).toBe(true)
    expect(mocks.post).toHaveBeenCalledWith(
      'https://api.example/prefix/security/rebac/share-links/redeem',
      JSON.stringify({ token: invitation.token }),
      expect.any(Headers), expect.any(String), true, false, expect.any(Object),
    )
  })
  it('never sends tokens or credentials to an unconfigured service', async () => {
    expect((await useShareInvitationClient().redeem({ ...invitation, service: 'https://attacker.example' })).ok).toBe(false)
    expect(mocks.post).not.toHaveBeenCalled()
  })
  it('requires the profile and authentication before sending a request', async () => {
    mocks.profile = false
    await useShareInvitationClient().redeem(invitation)
    mocks.profile = true
    mocks.authenticated = false
    await useShareInvitationClient().redeem(invitation)
    expect(mocks.post).not.toHaveBeenCalled()
  })
  it('does not expose backend error details or resource information', async () => {
    mocks.post.mockResolvedValue({ success: false, status: 404, data: { resource: 'hidden-resource', message: 'wrong-recipient' } })
    const result = await useShareInvitationClient().redeem(invitation)
    expect(result.message).toBe('This invitation is unavailable. Ask the sender for a new link.')
    expect(JSON.stringify(result)).not.toContain('hidden-resource')
    expect(JSON.stringify(result)).not.toContain('wrong-recipient')
  })
})

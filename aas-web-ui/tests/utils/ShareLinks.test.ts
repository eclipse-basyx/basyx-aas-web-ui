import { afterEach, describe, expect, it } from 'vitest'
import { captureInvitation, clearInvitation, pendingInvitation, restoreInvitation } from '@/composables/ShareInvitation'
import { buildInvitationUrl, parseInvitation, shareServiceUrl } from '@/utils/ShareLinks'

const token = 'a'.repeat(43)
afterEach(() => {
  clearInvitation()
  window.history.replaceState(null, '', '/')
})

describe('Invitation URLs', () => {
  it('keeps the secret and service routing in the fragment, without resource identifiers', () => {
    const link = buildInvitationUrl(`#/share-access?token=${token}`, 'https://api.example/prefix/shells/', 'AASRepo')
    const url = new URL(link)
    expect(url.origin).toBe(window.location.origin)
    expect(url.search).toBe('')
    expect(parseInvitation(url.hash)).toMatchObject({ token, service: 'https://api.example/prefix', component: 'AASRepo' })
    expect(shareServiceUrl('https://api.example/prefix/submodels', 'SubmodelRepo')).toBe('https://api.example/prefix')
  })

  it('rejects malformed tokens, unknown components and credential-bearing service URLs', () => {
    for (const fragment of [
      '#/share-access?token=bad',
      `#/share-access?token=${token}&component=CompanyLookup&service=https://api.example`,
      `#/share-access?token=${token}&component=AASRepo&service=https://user:password@api.example`,
      `#/share-access?token=${token}&component=AASRepo&service=javascript:alert(1)`,
    ]) {
      expect(parseInvitation(fragment)).toBeUndefined()
    }
    expect(() => buildInvitationUrl('https://untrusted.example/?token=' + token, 'https://api.example', 'AASRepo')).toThrow()
  })

  it('removes secrets from browser history immediately and resumes across sign-in redirects', () => {
    const link = buildInvitationUrl(`#/share-access?token=${token}`, 'https://api.example', 'AASRepo')
    window.history.replaceState(null, '', link)
    expect(captureInvitation()).toBe(true)
    expect(window.location.href).not.toContain(token)
    expect(window.location.hash).toBe('')
    expect(pendingInvitation.value).toMatchObject({ token })
    pendingInvitation.value = undefined
    restoreInvitation()
    expect(pendingInvitation.value).toMatchObject({ token })
    clearInvitation()
    restoreInvitation()
    expect(pendingInvitation.value).toBeUndefined()
  })

  it('expires the tab-scoped sign-in handoff and clears malformed links from history', () => {
    sessionStorage.setItem('pending-share-invitation', JSON.stringify({ token, service: 'https://api.example', component: 'AASRepo', receivedAt: Date.now() - 16 * 60 * 1000 }))
    restoreInvitation()
    expect(pendingInvitation.value).toBeUndefined()
    expect(sessionStorage.getItem('pending-share-invitation')).toBeNull()
    window.history.replaceState(null, '', '/#/share-access?token=invalid-secret')
    captureInvitation()
    expect(window.location.href).not.toContain('invalid-secret')
  })
})

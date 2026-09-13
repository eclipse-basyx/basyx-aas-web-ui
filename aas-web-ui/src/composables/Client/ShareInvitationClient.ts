import type { ResourceAccessResult } from '@/types/ResourceAccess'
import type { PendingInvitation } from '@/utils/ShareLinks'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { shareServiceUrl } from '@/utils/ShareLinks'

export function useShareInvitationClient () {
  const infrastructure = useInfrastructureStore()
  const { postRequest } = useRequestHandling()

  function canRedeem (invitation: PendingInvitation): boolean {
    const configured = infrastructure.getSelectedInfrastructure?.components[invitation.component]?.url
    if (!configured || !infrastructure.supportsResourceAccess(invitation.component)) {
      return false
    }
    try {
      return shareServiceUrl(configured, invitation.component) === invitation.service
    } catch {
      return false
    }
  }

  async function redeem (invitation: PendingInvitation): Promise<ResourceAccessResult> {
    if (!canRedeem(invitation) || !infrastructure.getHasAuthenticationCredentials) {
      return { ok: false, message: 'Select the matching infrastructure and sign in before accepting this invitation.' }
    }
    // Use the locally configured service, never an arbitrary URL from the link.
    const configured = infrastructure.getSelectedInfrastructure!.components[invitation.component].url
    const service = shareServiceUrl(configured, invitation.component)
    try {
      const result = await postRequest(
        `${service}/security/rebac/share-links/redeem`,
        JSON.stringify({ token: invitation.token }),
        new Headers({ 'Content-Type': 'application/json' }),
        'accepting invitation', true, false,
        { suppressStatuses: [400, 401, 403, 404, 409, 429, 500, 502, 503] },
      )
      const status = result.status ?? result.raw?.status
      if (result.success) {
        return { ok: true, status }
      }
      return { ok: false, status, message: status === 401
        ? 'Please sign in again, then retry.'
        : ([400, 403, 404, 409].includes(status)
            ? 'This invitation is unavailable. Ask the sender for a new link.'
            : 'The invitation could not be accepted. Please try again.') }
    } catch {
      return { ok: false, message: 'The invitation could not be accepted. Please try again.' }
    }
  }

  return { canRedeem, redeem }
}

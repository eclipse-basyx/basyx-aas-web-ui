import type { AcceptedInvitation, ResourceAccessResult } from '@/types/ResourceAccess'
import type { PendingInvitation } from '@/utils/ShareLinks'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { managementUrl, shareServiceUrl } from '@/utils/ShareLinks'

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

  async function redeem (invitation: PendingInvitation): Promise<ResourceAccessResult<AcceptedInvitation>> {
    if (!canRedeem(invitation) || !infrastructure.getHasAuthenticationCredentials) {
      return { ok: false, message: 'Select the matching infrastructure and sign in before accepting this invitation.' }
    }
    // Use the locally configured service, never an arbitrary URL from the link.
    const configured = infrastructure.getSelectedInfrastructure!.components[invitation.component].url
    try {
      const result = await postRequest(
        `${managementUrl(configured, invitation.component)}/invitations/accept`,
        JSON.stringify({ token: invitation.token }),
        new Headers({ 'Content-Type': 'application/json' }),
        'accepting invitation', true, false,
        { suppressStatuses: [400, 404, 409, 503] },
      )
      const status = result.status ?? result.raw?.status
      if (result.success) {
        return { ok: true, status, data: result.data as AcceptedInvitation }
      }
      return { ok: false, status, message: status === 401
        ? 'Please sign in again, then retry.'
        : ([400, 404, 409].includes(status)
            ? 'This invitation is invalid, expired or already used. Ask the sender for a new link.'
            : 'The invitation could not be accepted. Please try again.') }
    } catch {
      return { ok: false, message: 'The invitation could not be accepted. Please try again.' }
    }
  }

  return { canRedeem, redeem }
}

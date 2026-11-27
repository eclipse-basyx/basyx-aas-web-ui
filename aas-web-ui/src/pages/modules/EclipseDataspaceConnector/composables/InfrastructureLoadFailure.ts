import type { InfrastructureConfig } from '@/types/Infrastructure'
import { isLoggedOutOfOAuth2 } from '@/utils/InfrastructureUtils'

// Why a list of an infrastructure could not be loaded: a missing or rejected login, a user without access, or anything else
export type InfrastructureLoadFailureKind = 'authentication' | 'denied' | 'unavailable'

export interface InfrastructureLoadFailureMessage {
  title: string
  text: string
}

/**
 * Describes a list of an infrastructure that could not be loaded, e.g. the AAS of its AAS Repository.
 * `status` is the HTTP status of the failed request, `resourceLabel` names the list items in the title, e.g. `AAS`.
 */
export function infrastructureLoadFailureMessage (
  infrastructure: InfrastructureConfig | null,
  status: number | undefined,
  resourceLabel: string,
  texts: Record<InfrastructureLoadFailureKind, string>,
): InfrastructureLoadFailureMessage {
  const titles: Record<InfrastructureLoadFailureKind, string> = {
    authentication: 'Authentication Required',
    denied: 'Access Denied',
    unavailable: `${resourceLabel} Not Available`,
  }
  const kind = infrastructureLoadFailureKind(infrastructure, status)
  return { title: titles[kind], text: texts[kind] }
}

function infrastructureLoadFailureKind (infrastructure: InfrastructureConfig | null, status: number | undefined): InfrastructureLoadFailureKind {
  if (status === 401 || isLoggedOutOfOAuth2(infrastructure)) {
    return 'authentication'
  }
  if (status === 403) {
    return 'denied'
  }
  return 'unavailable'
}
